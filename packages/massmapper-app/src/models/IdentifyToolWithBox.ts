import { DomEvent, DomUtil, Handler, LatLngBounds, LeafletEventHandlerFn, LeafletMouseEvent, Util } from "leaflet";
import { autorun, IReactionDisposer, IReactionPublic } from "mobx";
import { MapService } from "../services/MapService";
import { Tool } from "./Tool";
import { LegendService } from "../services/LegendService";
import { SelectionService } from "../services/SelectionService";
import { MakeToolButtonComponent } from "../components/MakeToolButtonComponent";
import identify from '../images/identify-box.png';

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

		if (!this._moved) { return; }

		// Postpone to next JS tick so internal click event handling
		// still see it as "moved".
		this._clearDeferredResetState();
		this._resetStateTimeout = setTimeout(Util.bind(this._resetState, this), 0);

		this.actionHandler(this._startPoint, this._point);
	},
});

class IdentifyToolWithBox extends Tool {

	private _identifyBoxDisposer:IReactionDisposer;
	private _handler: Handler;

	protected async _activate() {
		const ms = this._services.get(MapService);
		this._identifyBoxDisposer = autorun((r:IReactionPublic) => {
			if (!ms.leafletMap) {
				return;
			}

			this._cursor = 'crosshair';

			if (!ms.leafletMap['identifyBox']) {
				ms.leafletMap.addHandler('identifyBox', BoxIdentify);
				this._handler = ms.leafletMap['identifyBox'];
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
		this._identifyBoxDisposer && this._identifyBoxDisposer();
	}

	// no component for this tool
	public component() {
		return MakeToolButtonComponent(identify, 'Click to drag a box and identify features');
	}

	public async handleIdentifyClick(startPoint:any, point:any) {

		// do the identify here
		const legendService = this._services.get(LegendService);
		const mapService = this._services.get(MapService);

		if (!legendService || legendService.enabledLayers.length === 0) {
			return;
		}

		const bbox = new LatLngBounds(
				mapService.leafletMap!.containerPointToLatLng(startPoint),
				mapService.leafletMap!.containerPointToLatLng(point));

		legendService.enabledLayers.forEach(async (l) => {
			if (!l.scaleOk) {
				return;
			}

			if (l.layerType === 'tiled_overlay' && l.queryName === l.name) {
				return;
			}

			const selService = this._services.get(SelectionService);
			selService.addIdentifyResult(l, bbox);
		});

	}
}

export { IdentifyToolWithBox };