import { MapService } from "../services/MapService";
import { Tool } from "./Tool";

import {
	LatLng,
	LatLngBounds,
} from 'leaflet';

import { MakeToolButtonComponent } from '../components/MakeToolButtonComponent';
import { ZoomOutMap } from '@material-ui/icons';
import { ConfigService } from "../services/ConfigService";

class ZoomToMaxExtentTool extends Tool {

	protected _isButton = true;

	protected async _deactivate() {
		// no-op
	}

	protected async _activate() {
		const ms = this._services.get(MapService);
		const cs = this._services.get(ConfigService);
		if (!cs.ready || !ms.ready) {
			return;
		}

		ms.leafletMap?.fitBounds(new LatLngBounds(
			new LatLng(cs.initialExtent[1], cs.initialExtent[0]), 
			new LatLng(cs.initialExtent[3], cs.initialExtent[2])
		))
	}

	public component() {
		return MakeToolButtonComponent(ZoomOutMap, 'Zoom to max extent');
	}
}

export { ZoomToMaxExtentTool };