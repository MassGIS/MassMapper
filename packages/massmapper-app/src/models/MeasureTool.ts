import { Control, LeafletMouseEvent } from 'leaflet';
import { autorun } from "mobx";
import { MapService } from "../services/MapService";
import { Tool } from "./Tool";
import { MeasureToolComponent } from '../components/MeasureToolComponent';

import measure from '@tristanhoffmann/leaflet-measure';
const m = measure;
class MeasureTool extends Tool {

	private _measureControl:Control;

	public async activate() {
		super.activate();

		const ms = this._services.get(MapService);
		const disposer = autorun(() => {
			if (!ms.leafletMap) {
				return;
			}

			ms.leafletMap.on('click',() => {
				// add a measure point to the map and keep going
			});

			ms.leafletMap.on('mousemove', () => {

			});

			disposer();
		})
	}

	public component() {
		return MeasureToolComponent;
	}


	public async deactivate() {
		this._measureControl.remove();
	}
}

export { MeasureTool };