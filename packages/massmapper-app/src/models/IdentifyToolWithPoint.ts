import { LatLngBounds, LeafletEventHandlerFn, LeafletMouseEvent, Rectangle, rectangle } from "leaflet";
import { autorun, IReactionPublic } from "mobx";
import { MapService } from "../services/MapService";
import { Tool } from "./Tool";
import { LegendService } from "../services/LegendService";
import { SelectionService } from "../services/SelectionService";
import { MakeToolButtonComponent } from "../components/MakeToolButtonComponent";
import identify from '../images/identify.png';

class IdentifyToolWithPoint extends Tool {

	// private _myRect: Array<Rectangle> = [];
	private _handleIdentifyClick:LeafletEventHandlerFn = this.handleIdentifyClick.bind(this);
	protected async _activate() {
		const ms = this._services.get(MapService);
		autorun((r:IReactionPublic) => {
			if (!ms.leafletMap) {
				return;
			}

			ms.leafletMap.on(
				'click',
				this._handleIdentifyClick
			);
			r.dispose();
		})
	}



	protected async _deactivate() {
		const ms = this._services.get(MapService);
		ms.leafletMap?.off(
			'click',
			this._handleIdentifyClick
		);
	}

	// no component for this tool
	public component() {
		return MakeToolButtonComponent(identify, 'Click to identify a feature');
	}

	public async handleIdentifyClick(ev:LeafletMouseEvent) {

		// do the identify here
		const legendService = this._services.get(LegendService);
		if (!legendService || legendService.enabledLayers.length === 0) {
			return;
		}

		const ms = this._services.get(MapService);
		// this._myRect.forEach((f) => {
		// 	f.removeFrom(ms.leafletMap!);
		// });
		// this._myRect = [];

		legendService.enabledLayers.forEach(async (l) => {
			if (!l.scaleOk) {
				return;
			}

			if (l.layerType === 'tiled_overlay') {
				return;
			}

			let bbox;
			if (['pt','line'].includes(l.layerType)) {
				const clickBounds = new LatLngBounds(
					{lng: ev.latlng.lng - .0001, lat: ev.latlng.lat - .0001},
					{lng: ev.latlng.lng + .0001, lat: ev.latlng.lat + .0001}
				);
				const denom = 5000;
				bbox = clickBounds.pad(ms.currentScale/denom);
				console.log('padding with',(ms.currentScale/denom));
			} else {
				bbox = new LatLngBounds(
					{lng: ev.latlng.lng - .000001, lat: ev.latlng.lat - .000001},
					{lng: ev.latlng.lng + .000001, lat: ev.latlng.lat + .000001}
				);
			}

			// create an orange rectangle where we clicked
			// this._myRect.push(rectangle(bbox, {color: "#ff7800", weight: 1}).addTo(ms.leafletMap!));

			const selService = this._services.get(SelectionService);
			selService.addIdentifyResult(l, bbox);
		});
	}
}

export { IdentifyToolWithPoint };