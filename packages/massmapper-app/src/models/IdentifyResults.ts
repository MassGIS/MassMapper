import { LatLng, LatLngBounds } from "leaflet";
import { makeObservable, observable } from "mobx";
import { Layer } from "./Layer";
import he from 'he';
import parser from 'fast-xml-parser';

interface IdentifyResultFeature {
	id: string;
	properties: object;
	geometry_name: "shape",
	geometry: {
		type: "Point" | "Line" | "Polygon",
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

	get rows(): Array<any> {
		return this._features?.map(f => {
			return {
				id: f.id,
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
		this._features = jsonRes.features;

		this._isLoading = false;

		return this._features || [];
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

export { IdentifyResult }