import { Control, LeafletMouseEvent } from 'leaflet';
import { autorun } from "mobx";
import { MapService } from "../services/MapService";
import { Tool } from "./Tool";

import measure from '@tristanhoffmann/leaflet-measure';
const m = measure; // leaflet-measure decorates l.Control, so we need to *force* webpack to include it, even though it's unused

class MeasureTool extends Tool {

	private _measureControl:Control;

	public async activate() {
		const ms = this._services.get(MapService);
		const disposer = autorun(() => {
			if (!ms.leafletMap) {
				return;
			}

			const options = {
				position: 'topright'
			}

			this._measureControl = (Control as any).measure(options) as Control;

			this._measureControl.addTo(ms.leafletMap);

			disposer();
		})
	}

	public async deactivate() {
		this._measureControl.remove();
	}

	public async handleMeasureClick(ev:LeafletMouseEvent) {
		// do the Measure here

	}
}

export { MeasureTool };