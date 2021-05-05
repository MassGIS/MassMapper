import { LatLngBounds } from "leaflet";
import { makeObservable, observable } from "mobx";
import { Layer } from "./Layer";
import he from 'he';
import parser from 'fast-xml-parser';

interface SelectedFeature {
	id: string;
	feature: object;
};

class IdentifyResult {
	private _isLoading: boolean;
	private _selectedFeatures?: SelectedFeature[];
	private _numFeatures: number;

	get isLoading(): boolean {
		return this._isLoading;
	}

	get numFeaturesDisplay():string {
		return this.isLoading ? 'loading...' : this._numFeatures + "";
	}

	constructor(
		public readonly layer: Layer
	) {
		this._isLoading = false;
		this._numFeatures = -1;
		this._selectedFeatures = [];

		makeObservable<IdentifyResult, '_isLoading' | '_selectedFeatures' | '_numFeatures'>(
			this,
			{
				_isLoading: observable,
				_selectedFeatures: observable,
				_numFeatures: observable,
			}
		);
	}

	public async getNumFeatures(bbox: LatLngBounds): Promise<number> {
		this._isLoading = true;

		const params = [
			'service=WFS',
			'version=1.1.0',
			'request=GetFeature',
			'typeName=' + this.layer.name,
			'srsname=EPSG:4326',
			'resultType=hits',
			'bbox=' +  bbox.toBBoxString() + ',EPSG:4326'
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