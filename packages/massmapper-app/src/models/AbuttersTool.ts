import { DomEvent, DomUtil, Handler, LatLngBounds, Point, Util, polyline, polygon, latLng, Polygon, Polyline } from "leaflet";
import { autorun, IReactionDisposer, IReactionPublic, makeObservable, observable } from "mobx";
import { MapService } from "../services/MapService";
import { Tool, ToolPosition } from "./Tool";
import { LegendService } from "../services/LegendService";
import { SelectionService } from "../services/SelectionService";
import { AbuttersToolComponent } from "../components/AbuttersToolComponent";
import { ContainerInstance } from "typedi";
import * as turf from '@turf/turf';
import buffer from '@turf/buffer';
// import proj4, { TemplateCoordinates } from 'proj4';
import { IdentifyResult } from "./IdentifyResults";
import { toast } from 'react-toastify';
import { ConfigService } from "../services/ConfigService";
import { ToolService } from "../services/ToolService";
import { PrintPdfTool } from "./PrintPdfTool";

const SP_METERS = "+proj=lcc +lat_1=42.68333333333333 +lat_2=41.71666666666667 +lat_0=41 +lon_0=-71.5 +x_0=200000 +y_0=750000 +ellps=GRS80 +datum=NAD83 +units=m +no_defs";
const EPSG_4326 = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";
const BoxIdentify = (window.L.Map as any).BoxZoom.extend({
	_onMouseDown: function (e:any) {

		// Clear the deferred resetState if it hasn't executed yet, otherwise it
		// will interrupt the interaction and orphan a box element in the container.
		this._clearDeferredResetState();
		this._resetState();

		DomUtil.disableTextSelection();
		DomUtil.disableImageDrag();

		this._startPoint = this._map.mouseEventToContainerPoint(e);

		DomEvent.on(document as any as HTMLElement, {
			contextmenu: DomEvent.stop,
			mousemove: this._onMouseMove,
			mouseup: this._onMouseUp,
			keydown: this._onKeyDown
		}, this);
	},
	_onMouseUp: function (e:any) {
		if ((e.which !== 1) && (e.button !== 1)) { return; }

		this._finish();

		// if (!this._moved) { return; }

		// Postpone to next JS tick so internal click event handling
		// still see it as "moved".
		this._clearDeferredResetState();
		this._resetStateTimeout = setTimeout(Util.bind(this._resetState, this), 0);

		this.actionHandler(this._startPoint, this._point);

		// If we don't explicitly delete this._point, the last point from a previous bbox
		// will linger and gum up and subsequent point queries.  Perhaps this artifact is
		// a side-effect commenting out the !this._moved line.
		delete this._point;
	},
});

// function reproject(geom:any, srs:proj4.Converter): any {
// 	geom.coordinates[0].map((c:Array<number>) => epsg26986.inverse(c))

// }

class AbuttersTool extends Tool {

	private _handlerDisposer:IReactionDisposer;
	private _handler: Handler;
	private _abuttersLayer: string;
	private _abuttersShape: Polyline;

	public buffer?: number = 1;
	public units: 'ft' | 'm' = 'ft';

	constructor(
		protected readonly _services:ContainerInstance,
		public readonly id:string,
		public position: ToolPosition,
		public readonly options: any
	) {
		super(_services,id,position,options);

		this._abuttersLayer = options['abuttersLayer'];

		makeObservable<AbuttersTool >(
			this,
			{
				buffer: observable,
				units: observable,
			}
		);

		autorun(() => {
			const ss = this._services.get(SelectionService);
			const ms = this._services.get(MapService);
			const ts = this._services.get(ToolService);
			if (ts.activeTool instanceof PrintPdfTool) {
				(ts.activeTool as PrintPdfTool).arrivedFromAbutters = true;
				return;
			}
			if (ss.identifyResults.length === 0) {
				this._abuttersShape &&
				this._abuttersShape.removeFrom(ms.leafletMap!);
			}
		},
		{
			delay: 100
		});
	}

	protected async _activate() {
		const ms = this._services.get(MapService);
		this._handlerDisposer = autorun((r:IReactionPublic) => {
			if (!ms.leafletMap) {
				return;
			}

			this._cursor = 'crosshair';

			if (!ms.leafletMap['abuttersBox']) {
				ms.leafletMap.addHandler('abuttersBox', BoxIdentify);
				this._handler = ms.leafletMap['abuttersBox'];
				this._handler['actionHandler'] = this.handleIdentifyClick.bind(this);
			}

			this._handler.enable();
			ms.leafletMap?.dragging.disable();

			r.dispose();
		});
	}

	protected async _deactivate() {
		const ms = this._services.get(MapService);
		ms.leafletMap?.dragging.enable();
		this._handler && this._handler.disable();
		this._handlerDisposer && this._handlerDisposer();
	}

	// no component for this tool
	public component() {
		return AbuttersToolComponent;
	}

	public async handleIdentifyClick(startPoint: Point, endPoint: Point) {
		// do the identify here
		const legendService = this._services.get(LegendService);
		const selService = this._services.get(SelectionService);
		const ms = this._services.get(MapService);

		if (this._abuttersShape) {
			this._abuttersShape.removeFrom(ms.leafletMap!);
		}

		selService.clearIdentifyResults();

		let bbox;
		if (!endPoint) {
			// it's a click, not a drag
			const geoPoint = ms.leafletMap!.containerPointToLatLng(startPoint);
			bbox = new LatLngBounds(
				{lng: geoPoint.lng - .00000000001, lat: geoPoint.lat - .00000000001},
				{lng: geoPoint.lng + .00000000001, lat: geoPoint.lat + .00000000001}
			);
		} else {
			bbox = new LatLngBounds(
				ms.leafletMap!.containerPointToLatLng(startPoint),
				ms.leafletMap!.containerPointToLatLng(endPoint));
		}

		// Problems w/ queries?  Uncomment next lines to see what's being passed to the backend.
		/*
			ms.leafletMap?.addLayer(
				new Polyline(
					[bbox.getSouthWest(), bbox.getNorthEast()]
				)
			)
		*/

		const abuttersLayer = legendService.layers.filter(l => this._abuttersLayer === l.name);
		if (abuttersLayer.length === 0) {
			debugger;
			toast('Please add the layer "Property Tax Parcels" to the map');
			return;
		}

		// search based on the selected bbox
		const configService = this._services.get(ConfigService);
		const targetParcels = new IdentifyResult(
			abuttersLayer[0],
			bbox,
			configService.geoserverUrl,
		);
		const targetFeatures = await targetParcels.getResults(false);

		const uniqueLocIdCount = Array.from(targetFeatures.reduce((p, c) => {
			p.add(c.properties.loc_id);
			return p;
		}, new Set()).values()).length;

		// if (targetFeatures.length > 3) {
		if (uniqueLocIdCount > 3) {
			toast("We're sorry, but you have exceeded the maximum number of features (3) that you may select to buffer.  Please reduce your selection and try again.");
			return;
		}

		const excludeIds = targetFeatures.map(f => f.id);

		// union together the target features
		let abuttersQueryShape:turf.Polygon | turf.MultiPolygon | undefined;

		// keep track of any offensive poly_type's
		let filteredPolyTypes = 0;
		targetFeatures.forEach(f => {
			if (f.properties.poly_type === "ROW") {
				filteredPolyTypes++;
			}
			else {
				const turfPoly = geojsonFeatureToTurfFeature(f);
				if (!abuttersQueryShape) {
					abuttersQueryShape = turfPoly;
				} else {
					abuttersQueryShape = turf.union(abuttersQueryShape, turfPoly)!.geometry;
				}
			}
		});

		if (filteredPolyTypes > 0) {
			toast("Parcels of type ROW were dropped from the selected features.");
		}

		if (!abuttersQueryShape) {
			toast("There are no features eligible for buffering. Please retry.");
			return;
		}

		// // coords come back in 26986 - reproject to 4326?
		// const transform = proj4(SP_METERS, "EPSG:4326");
		// const coords = (abuttersQueryShape.coordinates[0] as Position[]).map((p) => {
		// 	return transform.forward([round(p[0], 2), round(p[1], 2)]);
		// });

		// abuttersQueryShape.coordinates = [coords];

		// now buffer the target features in meters
		// 0 buffer is a no-op
		// TODO: convert buffer distance to metecrs for map units, later
		// const bufferDist = this.buffer * xxx
		const buf = Math.max(this.buffer || 1, 3);
		const units = this.buffer === 0 ? 'ft' : this.units;
		abuttersQueryShape = buffer(abuttersQueryShape, buf, {units: units === 'ft' ? 'feet' : 'meters'}).geometry;

		const abuttersOutlinePolygon = abuttersQueryShape; //turfReproject(abuttersQueryShape, SP_METERS, EPSG_4326);
		const abuttersOutlineLineString = (turf.polygonToLineString(abuttersOutlinePolygon) as turf.Feature).geometry as turf.Geometry;
		// convert the abutters linestring to leaflet
		const mapLatLngs = (abuttersOutlineLineString as turf.LineString).coordinates.map(p => latLng(p[1],p[0]));
		this._abuttersShape = polyline(mapLatLngs, {color: "#ff7800", weight: 4});
		this._abuttersShape.addTo(ms.leafletMap!);

		const abuttersIdResult = selService.addIdentifyResult(abuttersLayer[0], this._abuttersShape.getBounds());
		abuttersIdResult.intersectsShape = abuttersOutlineLineString;
		abuttersIdResult.excludeIds = excludeIds;
		abuttersIdResult.getNumFeatures();
		selService.selectedIdentifyResult = abuttersIdResult;
		abuttersIdResult.getResults(true);
	}
}

function geojsonFeatureToTurfFeature(f:{geometry:{coordinates: number[][][]}}):turf.Polygon {
	return turf.polygon([f.geometry.coordinates[0]]).geometry;
}

// function turfToLeaflet<T>(f:T, shapetypeConstructor:any):T {
// 	const fshp = f as any;
// 	return shapetypeConstructor(fshp.coordinates[0].map(
// 		(p:Position|Position[]) => {
// 			if (p instanceof Array) {
// 				return turfToLeaflet(p[1] as number, p[0] as number);
// 			} else {
// 			}
// 		})
// 	);
// }

const round = (number: number, decimalPlaces: number) => {
	const factorOfTen = Math.pow(10, decimalPlaces)
	return Math.round(number * factorOfTen) / factorOfTen
}

export { AbuttersTool };