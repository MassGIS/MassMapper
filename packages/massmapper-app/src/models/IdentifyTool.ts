import { LatLngBounds, LeafletEventHandlerFn, LeafletMouseEvent } from "leaflet";
import { autorun, IReactionPublic } from "mobx";
import { MapService } from "../services/MapService";
import { Tool } from "./Tool";
import { LegendService } from "../services/LegendService";
import { SelectionService } from "../services/SelectionService";
import { FunctionComponent } from "react";

class IdentifyTool extends Tool {

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
	public component():FunctionComponent {
		return () => { return null; }
	}

	public async handleIdentifyClick(ev:LeafletMouseEvent) {

		// do the identify here
		const legendService = this._services.get(LegendService);
		if (!legendService || legendService.enabledLayers.length === 0) {
			return;
		}

		const mapService = this._services.get(MapService);

		const clickBounds = new LatLngBounds(ev.latlng, {lng: ev.latlng.lng + .001, lat: ev.latlng.lat + .001});
		const bbox = clickBounds.pad(mapService.currentScale/100000);
		console.log('padding with',(mapService.currentScale/100000));

		legendService.enabledLayers.forEach(async (l) => {
			if (!l.scaleOk) {
				return;
			}

			const selService = this._services.get(SelectionService);
			selService.addIdentifyResult(l, bbox);
		});
	}
}

export { IdentifyTool };