import { LatLngBounds } from "leaflet";
import { makeObservable, observable } from "mobx";
import { Layer } from "./Layer";
import he from 'he';
import parser from 'fast-xml-parser';
import { v4 as uuid } from 'uuid';
import proj4 from 'proj4';
import * as turf from '@turf/turf';
import * as wkt from 'wellknown';
import { toast } from "react-toastify";

interface IdentifyResultFeature {
	id: string;
	isSelected: boolean;
	properties: any;
	geometry_name: "shape",
	geometry: {
		type: "Point" | "LineString" | "Polygon" | "MultiPolygon",
		coordinates: Array<any>
	}
};

class IdentifyResult {
	private _isLoading: boolean;
	private _features?: IdentifyResultFeature[];
	private _numFeatures: number;
	private _intersectsShape: turf.Geometry;
	private _excludeIds: string[];

	set intersectsShape(_is: turf.Geometry) {
		this._intersectsShape = _is;
	}

	set excludeIds(ids: string[]) {
		this._excludeIds = ids;
	}

	get isLoading(): boolean {
		return this._isLoading;
	}

	get numFeaturesDisplay():string {
		return this.isLoading ? 'loading...' : this._numFeatures + "";
	}

	get numFeatures():number {
		return this._numFeatures;
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

	get statePlaneMetersBBOXWKT(): string {
		const spMeters = "+proj=lcc +lat_1=42.68333333333333 +lat_2=41.71666666666667 +lat_0=41 +lon_0=-71.5 +x_0=200000 +y_0=750000 +ellps=GRS80 +datum=NAD83 +units=m +no_defs";
		const ul = [this.bbox.getNorthEast().lng, this.bbox.getNorthEast().lat];
		const lr = [this.bbox.getSouthWest().lng, this.bbox.getSouthWest().lat];
		const spul = proj4(spMeters).forward(ul);
		const splr = proj4(spMeters).forward(lr);

		return `POLYGON((${spul[0]} ${spul[1]
			}, ${spul[0]} ${splr[1]
			}, ${splr[0]} ${splr[1]
			}, ${splr[0]} ${spul[1]
			}, ${spul[0]} ${spul[1]}))`;
	}

	get statePlaneMetersIntersectsWKT(): string {
		const spMeters = "+proj=lcc +lat_1=42.68333333333333 +lat_2=41.71666666666667 +lat_0=41 +lon_0=-71.5 +x_0=200000 +y_0=750000 +ellps=GRS80 +datum=NAD83 +units=m +no_defs";
		const selShape = turfReproject(this._intersectsShape, 'EPSG:4326',spMeters);
		return wkt.stringify(selShape as wkt.GeoJSONGeometry);
	}

	constructor(
		public readonly layer: Layer,
		public readonly bbox: LatLngBounds,
		private _gsurl: string,
		private _outputCRS: string = 'EPSG:4326',
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

		const intersectionWkt = this._intersectsShape ?
			this.statePlaneMetersIntersectsWKT :
			this.statePlaneMetersBBOXWKT;

		const excludeIds = this._excludeIds ? "not in (" + this._excludeIds.map(id => `'${id}'`).join(',') + ")" : '1=1';

		const params = [
			'service=WFS',
			'version=1.1.0',
			'request=GetFeature',
			'typeName=' + this.layer.queryName,
			'srsname=' + this._outputCRS,
			'resultType=hits',
			// 'bbox=' +  this.bbox.toBBoxString() + ',EPSG:4326'
			`cql_filter=INTERSECTS(shape,geomFromWKT(${intersectionWkt})) and ${excludeIds}`
		];
		Object.entries(params);

		const res = await fetch(this._gsurl + '/geoserver/wfs',
			{
				method: 'POST',
				body: params.join('&'),
				headers: {'content-type': 'application/x-www-form-urlencoded;charset=UTF-8'}
			});
		const respBody = await res.text();
		this._numFeatures = getNumFeaturesFromHitsResponse(respBody);
		this._isLoading = false;
		return this._numFeatures;
	}

	public async getResults(filterPolyType: boolean): Promise<IdentifyResultFeature[]> {
		console.log(this.numFeaturesDisplay);
		this._isLoading = true;

		const intersectionWkt = this._intersectsShape ?
			this.statePlaneMetersIntersectsWKT :
			this.statePlaneMetersBBOXWKT;

		const excludeIds = this._excludeIds ? "not in (" + this._excludeIds.map(id => `'${id}'`).join(',') + ")" : '1=1';

		const params = [
			'service=WFS',
			'version=1.1.0',
			'request=GetFeature',
			'typeName=' + this.layer.queryName,
			'srsname=' + this._outputCRS,
			'outputFormat=application/json',
			// 'bbox=' +  this.bbox.toBBoxString() + ',EPSG:4326'
			`cql_filter=INTERSECTS(shape,geomFromWKT(${intersectionWkt})) and ${excludeIds}`
		];
		Object.entries(params);

		const res = await fetch(this._gsurl + '/geoserver/wfs',
			{
				method: 'POST',
				body: params.join('&'),
				headers: {'content-type': 'application/x-www-form-urlencoded;charset=UTF-8'}
			});

		const jsonRes = await res.json();
		(jsonRes.features as IdentifyResultFeature[]).forEach((feature) => {
			feature.id = feature.id || uuid();
		})

		let offensivePolyTypes = 0;
		this._features = [];
		for (let i = 0; i < jsonRes.features.length; i++) {
			if (filterPolyType && /^(ROW|PRIV_ROW)$/.test(jsonRes.features[i].properties.poly_type)) {
				offensivePolyTypes++;
			}
			else {
				this._features?.push(jsonRes.features[i]);
			}
		}
		if (offensivePolyTypes > 0) {
			toast("Parcels of type ROW or PRIV_ROW were dropped from the buffered features.");
		}

		this._isLoading = false;

		return this._features || [];
	}

	// public async exportToKML(selectedOnly: boolean) {
	// 	const exportUrl = `${this._gsurl}/geoserver/wms?
	// 		layers=${this.layer.queryName}&
	// 		service=WMS&
	// 		version=1.1.0&
	// 		request=GetMap&
	// 		bbox=${this.statePlaneMetersPolygonWKT}&
	// 		srs=EPSG:26986&
	// 		height=100&
	// 		width=100&
	// 		styles=&
	// 		format=application/vnd.google-earth.kml+xml
	// 		`.replace(/\n/g,'');

	// 	console.log(exportUrl);
	// }

	public async exportToUrl(fileType: 'csv' | 'xlsx' | 'shp' , selectedOnly:boolean) {
		console.log('exporting', this.rows.filter(r => r.isSelected || !selectedOnly).length,'features');
		// Get rid of any leading prefix:.
		const name = this.layer.name.replace(/^[^:]*:/, '');
		// Special lookup for tiled overlays.
		const queryName = this.layer.layerType === 'tiled_overlay' ? this.layer.queryName : this.layer.name;
		// Geoserver zip's up shapefile goodies.
		const ext = fileType === 'shp' ? 'zip' : fileType;
		const url = `/map_ol/getstore.php?name=${name}.${ext}&url=${this._gsurl}/geoserver/wfs`
		const outputFormatMap = {
			'xlsx': 'excel2007',
			'xls': 'excel97',
			'csv': 'csv',
			'shp' : 'shape-zip',
		}
		const shpPropertyName = fileType === 'shp' ? '<ogc:PropertyName>shape</ogc:PropertyName>' : '';
		const xml = `<wfs:GetFeature
	outputFormat="${outputFormatMap[fileType]}"
	xmlns:wfs="http://www.opengis.net/wfs"
	service="WFS"
	version="1.1.0"
	xsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.1.0/wfs.xsd"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xmlns:ogc="http://www.opengis.net/ogc">
	<wfs:Query typeName="${queryName}" srsName="EPSG:26986" xmlns:massgis="http://massgis.state.ma.us/featuretype">
		${this.properties.filter(p => p !== 'bbox').map(p => `<ogc:PropertyName>${p}</ogc:PropertyName>`).join('')}
		${shpPropertyName}
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

		// All download results live on maps.massgis.digital.mass.gov.
		return '//' + 'maps.massgis.digital.mass.gov' + exportData;
	}

	public async exportToMkzip(fileType: string) {
		const exportXML = `
<layers>
	<layer
		wmsStyle="Blank_Polys"
		wmsLayer="GISDATA.L3_TAXPAR_POLY_ASSESS"
		name="Tax Parcels for Query"
		baseURL="${this._gsurl}/geoserver/wms?layers___EQ___massgis:GISDATA.L3_TAXPAR_POLY_ASSESS___AMP___service___EQ___WMS___AMP___version___EQ___1.1.0___AMP___request___EQ___GetMap___AMP___bbox___EQ___160823.171987,876167.17726399,162545.925669,877561.99102299___AMP___srs___EQ___EPSG:26986___AMP___height___EQ___100___AMP___width___EQ___100___AMP___styles___EQ______AMP___format___EQ___application/vnd.google-earth.kml+xml">
		<metadata>http://www.mass.gov/info-details/massgis-data-property-tax-parcels</metadata>
		<metadata>http://maps.massgis.digital.mass.gov/metadata/GISDATA_L3_TAXPAR_POLY_ASSESS.shp.xml</metadata>
	</layer>
	<zip name="test-kml"/>
</layers>
`
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

function turfReproject<T extends turf.Geometry>(shape:T, srcSrs:string, targetSrs:string): T{
	const transform = proj4(srcSrs, targetSrs);

	// need to decide whether to swap axes if going to/from lat/lon, sheesh

	if (shape.type === 'Polygon') {
		const coordinates = (shape as turf.Polygon).coordinates[0].map(p => transform.forward(p))
		return turf.polygon([coordinates]).geometry as T;
	} else if (shape.type === 'MultiPolygon') {
		const coordinates = (shape as turf.MultiPolygon).coordinates[0].map(
			p =>
			p.map(
				p2 =>
				transform.forward(p2)
			)
		)
		return turf.multiPolygon([coordinates]).geometry as T;
	} else if (shape.type === 'LineString') {
		const coordinates = (shape as turf.LineString).coordinates.map(p => transform.forward(p))
		return turf.polygon([coordinates]).geometry as T;
	}

	return shape;
}

export { IdentifyResult, IdentifyResultFeature }