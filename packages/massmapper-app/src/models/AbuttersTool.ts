import { DomEvent, DomUtil, Handler, LatLngBounds, rectangle, Point, Util, polyline, latLng } from "leaflet";
import { autorun, IReactionDisposer, IReactionPublic, makeObservable, observable } from "mobx";
import { MapService } from "../services/MapService";
import { Tool, ToolPosition } from "./Tool";
import { LegendService } from "../services/LegendService";
import { SelectionService } from "../services/SelectionService";
import { AbuttersToolComponent } from "../components/AbuttersToolComponent";
import { ContainerInstance } from "typedi";
import * as turf from '@turf/turf';
import proj4 from 'proj4';


const SP_METERS = "+proj=lcc +lat_1=42.68333333333333 +lat_2=41.71666666666667 +lat_0=41 +lon_0=-71.5 +x_0=200000 +y_0=750000 +ellps=GRS80 +datum=NAD83 +units=m +no_defs";
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
	},
});

class AbuttersTool extends Tool {

	private _handlerDisposer:IReactionDisposer;
	private _handler: Handler;
	private _abuttersLayer: string;

	public buffer?: number = 0;
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

		selService.clearIdentifyResults();

		const ms = this._services.get(MapService);
		let bbox;
		if (!endPoint) {
			// it's a click, not a drag
			const geoPoint = ms.leafletMap!.layerPointToLatLng(startPoint);
			bbox = new LatLngBounds(
				{lng: geoPoint.lng - .000000001, lat: geoPoint.lat - .000000001},
				{lng: geoPoint.lng + .000000001, lat: geoPoint.lat + .000000001}
			);
		} else {
			bbox = new LatLngBounds(
				ms.leafletMap!.containerPointToLatLng(startPoint),
				ms.leafletMap!.containerPointToLatLng(endPoint));
		}

		const abuttersLayer = legendService.layers.filter(l => this._abuttersLayer === l.name);
		if (abuttersLayer.length === 0) {
			alert("error: can't find abutters layer " + this._abuttersLayer + " in layer list");
			return;
		}

		selService.addIdentifyResult(abuttersLayer[0], bbox);
		const targetFeatureResults = selService.identifyResults[0];
		const targetFeatures = await targetFeatureResults.getResults();

		// results come back in 4326, need to reproject back to 26986, do the buffer, then reproject back
		let bufferShape:turf.Polygon | turf.MultiPolygon | undefined;
		targetFeatures.forEach(f => {
			const epsg26986 = proj4(SP_METERS);
			const spMetersCoords = [f.geometry.coordinates[0].map((c:Array<number>) => epsg26986.inverse(c))];
			const poly = turf.polygon(spMetersCoords);
			if (!bufferShape) {
				bufferShape = poly.geometry;
			} else {
				bufferShape = turf.union(bufferShape, poly.geometry).geometry;
			}
		});
		if (!bufferShape) {
			// no shape?
			return;
		}

		// 0 buffer is a no-op
		bufferShape = this.buffer !== 0 ? turf.buffer(bufferShape, this.buffer).geometry : bufferShape;

		// now reproject bufferShape back to 4326


		// draw the bufferShape
		const bufferLine = (turf.polygonToLineString(bufferShape) as turf.Feature<turf.LineString>).geometry;
		const leafletLine = polyline(bufferLine.coordinates.map(p => { return latLng(p[1],p[0])}), {color: "#ff7800", weight: 1});
		leafletLine.addTo(ms.leafletMap!);
		debugger;

	}
}

export { AbuttersTool };