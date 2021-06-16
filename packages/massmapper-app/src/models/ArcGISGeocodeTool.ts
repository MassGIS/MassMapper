import { Tool, ToolPosition } from "./Tool";

import { ContainerInstance } from 'typedi';
import { ArcGISGeocodeToolComponent } from '../components/ArcGISGeocodeToolComponent';

class ArcGISGeocodeTool extends Tool {

	constructor(
		protected readonly _services:ContainerInstance,
		public readonly id:string,
		public position: ToolPosition,
		public readonly options:any
	) {
		super(_services,id,position,options);

		// makeObservable<GeocodeTool>(
		// 	this,
		// 	{
		// 	}
		// );
	}

	protected async _deactivate() {
		// no-op, never de-activates
	}

	protected async _activate() {
		// no-op, never activates
	}

	public component() {
		return ArcGISGeocodeToolComponent
	}
}

export { ArcGISGeocodeTool };