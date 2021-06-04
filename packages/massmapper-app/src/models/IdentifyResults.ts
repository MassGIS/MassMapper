import { LatLngBounds } from "leaflet";
import { makeObservable, observable } from "mobx";
import { Layer } from "./Layer";
import he from 'he';
import parser from 'fast-xml-parser';
import { v4 as uuid } from 'uuid';

interface IdentifyResultFeature {
	id: string;
	isSelected: boolean;
	properties: object;
	geometry_name: "shape",
	geometry: {
		type: "Point" | "LineString" | "Polygon",
		coordinates: Array<any>
	}
};

class IdentifyResult {
	private _isLoading: boolean;
	private _features?: IdentifyResultFeature[];
	private _numFeatures: number;

	get isLoading(): boolean {
		return this._isLoading;
	}

	get numFeaturesDisplay():string {
		return this.isLoading ? 'loading...' : this._numFeatures + "";
	}

	get features(): IdentifyResultFeature[] {
		return this._features || [];
	}

	get typeName(): string {
		return this.layer.name;
	}

	get rows(): Array<any> {
		return this._features?.map(f => {
			return {
				id: f.id,
				isSelected: f.isSelected,
				...f.properties
			}
		}) || [];
	}

	get properties(): string[] {
		if (!this._features || this._features.length === 0) {
			return [];
		}
		return Object.keys(this._features[0].properties);
	}

	constructor(
		public readonly layer: Layer,
		public readonly bbox: LatLngBounds,
	) {
		this._isLoading = false;
		this._numFeatures = -1;
		this._features = [];

		makeObservable<IdentifyResult, '_isLoading' | '_features' | '_numFeatures'>(
			this,
			{
				_isLoading: observable,
				_features: observable,
				_numFeatures: observable,
			}
		);
	}

	public clearSelected() {
		this._features?.forEach(f => {
			f.isSelected = false;
		});
	}
	public setSelected(featureId: string, selected: boolean) {
		const f = this._features?.filter(f => f.id === featureId)[0];
		f && (f.isSelected = selected);
	}

	public async getNumFeatures(): Promise<number> {
		this._isLoading = true;

		const params = [
			'service=WFS',
			'version=1.1.0',
			'request=GetFeature',
			'typeName=' + this.layer.name,
			'srsname=EPSG:4326',
			'resultType=hits',
			'bbox=' +  this.bbox.toBBoxString() + ',EPSG:4326'
		];
		Object.entries(params);

		const res = await fetch('https://giswebservices.massgis.state.ma.us/geoserver/wfs?' + params.join('&'),
			{
				method: 'GET'
			});
		const respBody = await res.text();
		this._numFeatures = getNumFeaturesFromHitsResponse(respBody);
		this._isLoading = false;
		return this._numFeatures;
	}

	public async getResults(): Promise<IdentifyResultFeature[]> {
		this._isLoading = true;
		const params = [
			'service=WFS',
			'version=1.1.0',
			'request=GetFeature',
			'typeName=' + this.layer.name,
			'srsname=EPSG:4326',
			'outputFormat=application/json',
			'bbox=' +  this.bbox.toBBoxString() + ',EPSG:4326'
		];
		Object.entries(params);

		const res = await fetch('https://giswebservices.massgis.state.ma.us/geoserver/wfs?' + params.join('&'),
			{
				method: 'GET'
			});

		const jsonRes = await res.json();
		(jsonRes.features as IdentifyResultFeature[]).forEach((feature) => {
			feature.id = feature.id || uuid();
		})
		this._features = jsonRes.features;

		this._isLoading = false;

		return this._features || [];
	}

	public async exportToUrl(fileType: 'csv' | 'xlsx' | 'xls', selectedOnly:boolean) {
		console.log('exporting', this.rows.filter(r => r.isSelected || !selectedOnly).length,'features');
		// Get rid of any leading prefix:.
		const name = this.layer.name.replace(/^[^:]*:/, '');
		const url = `https://massgis.2creek.com/oliver-data/getstore.php?name=${name}.${fileType}&url=http://giswebservices.massgis.state.ma.us/geoserver/wfs`
		const outputFormatMap = {
			'xlsx': 'excel2007',
			'xls': 'excel97',
			'csv': 'csv'
		}
		const xml = `<wfs:GetFeature
	outputFormat="${outputFormatMap[fileType]}"
	xmlns:wfs="http://www.opengis.net/wfs"
	service="WFS"
	version="1.1.0"
	xsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.1.0/wfs.xsd"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xmlns:ogc="http://www.opengis.net/ogc">
	<wfs:Query typeName="${this.layer.name}" srsName="EPSG:900913" xmlns:massgis="http://massgis.state.ma.us/featuretype">
		${this.properties.filter(p => p !== 'bbox').map(p => `<ogc:PropertyName>${p}</ogc:PropertyName>`).join('')}
		<ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">
			${this.rows.filter(r => r.isSelected || !selectedOnly).map(r => `<ogc:FeatureId fid="${r.id}"/>`).join('')}
		</ogc:Filter>
	</wfs:Query>
	</wfs:GetFeature>`;

		const res = await fetch(url,
			{
				body: xml,
				method: "POST",
				mode: 'cors',
			});

		const exportData = await res.text();

		// Specify host since getstore went through a proxy.
		return 'http://maps.massgis.state.ma.us' + exportData;
	}
};

const getNumFeaturesFromHitsResponse = (hitsBody:string): number => {
	const options = {
		attributeNamePrefix: "",
		// attrNodeName: "attrs", //default is 'false'
		// textNodeName : "#text",
		ignoreAttributes: false,
		ignoreNameSpace: true,
		allowBooleanAttributes: false,
		parseNodeValue: false,
		parseAttributeValue: true,
		trimValues: true,
		cdataTagName: "__cdata", //default is 'false'
		cdataPositionChar: "\\c",
		parseTrueNumberOnly: false,
		arrayMode: true, //"strict"
		attrValueProcessor: (val: string, attrName: string) => he.decode(val, { isAttributeValue: true }),//default is a=>a
		tagValueProcessor: (val: string, attrName: string) => he.decode(val) //default is a=>a
	};

	const xml = parser.parse(hitsBody, options);
	return xml.FeatureCollection[0].numberOfFeatures;
}

export { IdentifyResult, IdentifyResultFeature }