import { DomEvent, Draw, FeatureGroup, Handler, LatLngBounds, LeafletEventHandlerFn, LeafletMouseEvent, Util } from "leaflet";
import { autorun, IReactionDisposer, IReactionPublic } from "mobx";
import { MapService } from "../services/MapService";
import { Tool } from "./Tool";
import { LegendService } from "../services/LegendService";
import { SelectionService } from "../services/SelectionService";
import { MakeToolButtonComponent } from "../components/MakeToolButtonComponent";
import identify from '../images/identify-box.png';
import * as turf from '@turf/turf';
import draw from 'leaflet-draw';
import IdentifyResultsModal from "../components/IdentifyResultsModal";
const d = draw;
class IdentifyToolWithBox extends Tool {

	private _identifyBoxDisposer:IReactionDisposer;
	private _handler: Draw.Polygon;
	private _drawnItems: FeatureGroup = new FeatureGroup();

	protected async _activate() {
		const ms = this._services.get(MapService);
		this._identifyBoxDisposer = autorun((r:IReactionPublic) => {
			if (!ms.leafletMap) {
				return;
			}

			this._cursor = 'crosshair';

			if (!ms.leafletMap['identifyPoly']) {
				// ms.leafletMap.addHandler('identifyBox', BoxIdentify);
				ms.leafletMap.addHandler('identifyPoly', (window.L as any).Draw.Polygon);
				this._handler = ms.leafletMap['identifyPoly'];
			}
			this._handler.disable();
			ms.leafletMap.on('dblclick', (e:any) => {
				this._handler.completeShape();
			})
			ms.leafletMap.on(Draw.Event.CREATED, this._handleIdentify.bind(this));
			ms.leafletMap.on(Draw.Event.DRAWVERTEX, this._clearExistingShape.bind(this));
			ms.leafletMap.doubleClickZoom.disable();

			this._handler.enable();
			r.dispose();
		});
	}


	protected async _deactivate() {
		const ms = this._services.get(MapService);

		ms.leafletMap?.dragging.enable();
		ms.leafletMap?.doubleClickZoom.enable();
		this._handler?.disable();

		this._identifyBoxDisposer && this._identifyBoxDisposer();
		ms.leafletMap?.off(Draw.Event.CREATED, this._handleIdentify.bind(this));
		ms.leafletMap?.off(Draw.Event.DRAWVERTEX, this._clearExistingShape.bind(this));

	}

	// no component for this tool
	public component() {
		return MakeToolButtonComponent(identify, 'Click to draw a polygon and identify features');
	}

	private _clearExistingShape() {
		this._drawnItems && this._drawnItems.clearLayers();
	}

	private async _handleIdentify(evt:any) {

		// do the identify here
		const legendService = this._services.get(LegendService);
		const mapService = this._services.get(MapService);

		if (!legendService || legendService.enabledLayers.length === 0) {
			return;
		}

		if (!this._drawnItems['_map']) {
			mapService.leafletMap?.addLayer(this._drawnItems);
		}
		this._drawnItems.addLayer(evt.layer);

		const idFeature = turf.polygon([evt.layer.toGeoJSON().geometry.coordinates[0]]).geometry;

		if (legendService.enabledLayers.filter((l) => l.scaleOk).length === 0) {
			this._clearExistingShape();
			alert("No layers are available to query right now - add some layers that are visible at this scale first.");
			window.setTimeout(() => {
				this._handler.enable();
			}, 100);
			return;
		}

		legendService.enabledLayers.forEach(async (l) => {
			if (!l.scaleOk) {
				return;
			}

			if (l.layerType === 'tiled_overlay' && l.queryName === l.name) {
				return;
			}

			const selService = this._services.get(SelectionService);
			selService.addIdentifyResult(l, evt.layer.getBounds(), idFeature);
		});

		window.setTimeout(() => {

			this._handler.enable();
		}, 100);

	}
}

export { IdentifyToolWithBox };