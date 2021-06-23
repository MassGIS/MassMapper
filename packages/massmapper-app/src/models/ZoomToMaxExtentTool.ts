import { MapService } from "../services/MapService";
import { Tool } from "./Tool";

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

		ms.leafletMap?.panTo(cs.initialExtent);
		ms.leafletMap?.setZoom(cs.initialZoomLevel);
	}

	public component() {
		return MakeToolButtonComponent(ZoomOutMap, 'Zoom to max extent');
	}
}

export { ZoomToMaxExtentTool };