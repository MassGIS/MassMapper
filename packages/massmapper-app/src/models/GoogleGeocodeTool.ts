import { Tool, ToolPosition } from "./Tool";

import { ContainerInstance } from 'typedi';
import { GoogleGeocodeToolComponent } from '../components/GoogleGeocodeToolComponent';

class GoogleGeocodeTool extends Tool {

	protected async _deactivate() {
		// no-op, never de-activates
	}

	protected async _activate() {
		// no-op, never activates
	}

	public component() {
		return GoogleGeocodeToolComponent
	}
}

export { GoogleGeocodeTool };