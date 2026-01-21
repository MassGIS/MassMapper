import { MapService } from "../services/MapService";
import { Tool, ToolPosition } from "./Tool";
import { ZoomToolComponent } from "../components/ZoomToolComponent";
import { ContainerInstance } from "typedi";
import { LatLngBounds } from "leaflet";
import { autorun } from "mobx";

class ZoomTool extends Tool {

	protected _isButton = true;
	private _Zoom:LatLngBounds[] = [];
	private _historyPointer:number = 0;
	private _skipNext: boolean = false;

	constructor(
		protected readonly _services:ContainerInstance,
		public readonly id:string,
		public position: ToolPosition,
		public readonly options:any
	) {
		super(_services,id,position,options);

		this._Zoom = [];
		window['Zoom'] = this._Zoom;

		const mapService = _services.get(MapService);
		autorun((r) => {
			if (!mapService.leafletMap) {
				return;
			}
			mapService.leafletMap!.on('moveend zoomend', () => {
				if (this._historyPointer > 0 &&
						this._Zoom[this._historyPointer - 1].equals(mapService.leafletMap!.getBounds())) {
					// spurrious move/zoom.  Ignore it.
					return;
				}
				if (this._skipNext) {
					this._skipNext = false;
					return;
				}
				if (this._historyPointer !== this._Zoom.length) {
					this._Zoom = this._Zoom.slice(0, this._historyPointer);
					window['Zoom'] = this._Zoom;
				}
				this._Zoom.push(mapService.leafletMap!.getBounds());
				this._historyPointer = this._Zoom.length;
			});
			r.dispose();
		});
	}

	public back() {
		if (this._historyPointer <= 1) {
			// no-op
			return;
		}
		this._historyPointer--;
		this._skipNext = true;
		this._services.get(MapService).leafletMap!.fitBounds(this._Zoom[this._historyPointer - 1]);
	}

	public forward() {
		if (this._historyPointer === this._Zoom.length) {
			// no-op
			return;
		}
		this._historyPointer++;
		this._skipNext = true;
		this._services.get(MapService).leafletMap!.fitBounds(this._Zoom[this._historyPointer - 1]);
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