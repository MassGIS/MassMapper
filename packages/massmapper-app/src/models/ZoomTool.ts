import { MapService } from "../services/MapService";
import { Tool, ToolPosition } from "./Tool";
import { ZoomToolComponent } from "../components/ZoomToolComponent";
import { ContainerInstance } from "typedi";
import { autorun } from "mobx";

class ZoomTool extends Tool {

	protected _isButton = true;

	constructor(
		protected readonly _services:ContainerInstance,
		public readonly id:string,
		public position: ToolPosition,
		public readonly options:any
	) {
		super(_services, id, position, options);

		const mapService = _services.get(MapService);
		autorun((r) => {
			if (!mapService.leafletMap) {
				return;
			}
			r.dispose();
		});
	}

	public zoomIn() {
		this._services.get(MapService).leafletMap!.zoomIn();
	}

	public zoomOut() {
		this._services.get(MapService).leafletMap!.zoomOut();
	}

	protected async _deactivate() {
		// no-op
	}

	protected async _activate() {
		// no-op
	}

	public component() {
		return ZoomToolComponent;
	}
}

export { ZoomTool };