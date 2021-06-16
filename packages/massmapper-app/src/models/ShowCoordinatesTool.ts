import { autorun, makeObservable, observable } from "mobx";
import { MapService } from "../services/MapService";
import { Tool, ToolPosition } from "./Tool";

import { ShowCoordinatesToolComponent } from '../components/ShowCoordinatesToolComponent';
import { ContainerInstance } from 'typedi';
import { latLng, LatLng } from "leaflet";

class ShowCoordinatesTool extends Tool {

	get xCoord():string {
		return this._coords.lat.toFixed(5);
	}

	get yCoord():string {
		return this._coords.lng.toFixed(5);
	}

	private _coords:LatLng;

	constructor(
		protected readonly _services:ContainerInstance,
		public readonly id:string,
		public position: ToolPosition,
		public readonly options:any
	) {
		super(_services,id,position,options);

		const mapService = _services.get(MapService);
		this._coords = latLng(0,0);

		autorun((r) => {
			if (!mapService.ready || !mapService.leafletMap) {
				return;
			}

			this._coords = mapService.leafletMap.getCenter();

			mapService.leafletMap.on('mousemove', (e) => {
				this._coords = e['latlng'];
			});
			r.dispose();
		})

		makeObservable<ShowCoordinatesTool, '_coords'>(
			this,
			{
				_coords: observable,
			}
		);
	}

	protected async _deactivate() {
		// no-op, never de-activates
	}

	protected async _activate() {
		// no-op, never activates
	}

	public component() {
		return ShowCoordinatesToolComponent
	}
}

export { ShowCoordinatesTool };