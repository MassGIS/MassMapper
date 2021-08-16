import { autorun, makeObservable, observable, runInAction } from "mobx";
import { MapService } from "../services/MapService";
import { Tool, ToolPosition } from "./Tool";

import { ShowCoordinatesToolComponent } from '../components/ShowCoordinatesToolComponent';
import { ContainerInstance } from 'typedi';
import { latLng, LatLng } from "leaflet";
import proj4 from 'proj4';

enum units {
	DMS = 'lat lon (dms)',
	DD = 'lat lon',
	SP_METERS = 'sp meters',
	SP_FEET = 'sp feet',
}

const spMeters = "+proj=lcc +lat_1=42.68333333333333 +lat_2=41.71666666666667 +lat_0=41 +lon_0=-71.5 +x_0=200000 +y_0=750000 +ellps=GRS80 +datum=NAD83 +units=m +no_defs";
const toSpMeters = proj4('EPSG:4326',spMeters);

const spFeet = "+proj=lcc +lat_1=42.68333333333333 +lat_2=41.71666666666667 +lat_0=41 +lon_0=-71.5 +x_0=200000.0001016002 +y_0=750000 +ellps=GRS80 +datum=NAD83 +to_meter=0.3048006096012192 +no_defs"
const toSpFeet = proj4('EPSG:4326',spFeet);
class ShowCoordinatesTool extends Tool {

	get xCoord():string {
		if (this.units === units.SP_METERS) {
			return toSpMeters.forward([this._coords.lng, this._coords.lat])[0].toFixed(1);
		}
		if (this.units === units.SP_FEET) {
			return toSpFeet.forward([this._coords.lng, this._coords.lat])[0].toFixed(0);
		}
		if (this.units === units.DMS) {
			const d = Math.floor(Math.abs(this._coords.lat));
			const m = Math.floor((this._coords.lat - d) * 60);
			const s = ((this._coords.lat - d) - m/60) * 3600;

			return d + ":" + m + ":" + s.toFixed(3);
		}
		return this._coords.lat.toFixed(5);
	}

	get yCoord():string {
		if (this.units === units.SP_METERS) {
			return toSpMeters.forward([this._coords.lng, this._coords.lat])[1].toFixed(1);
		}
		if (this.units === units.SP_FEET) {
			return toSpFeet.forward([this._coords.lng, this._coords.lat])[1].toFixed(0);
		}
		if (this.units === units.DMS) {
			const d = Math.floor(Math.abs(this._coords.lng));
			const m = Math.floor((Math.abs(this._coords.lng) - d) * 60);
			const s = ((Math.abs(this._coords.lng) - d) - m/60) * 3600;

			return '-' + d + ":" + m + ":" + s.toFixed(3);
		}
		return this._coords.lng.toFixed(5);
	}

	private _coords:LatLng;
	public units: units = units.DD;
	public isChangingUnits: boolean = false;
	public buttonRef: HTMLButtonElement | null;

	constructor(
		protected readonly _services:ContainerInstance,
		public readonly id:string,
		public position: ToolPosition,
		public readonly options:any
	) {
		super(_services,id,position,options);

		const mapService = _services.get(MapService);
		runInAction(() => {
			this._coords = latLng(0,0);
		});

		autorun((r) => {
			if (!mapService.ready || !mapService.leafletMap) {
				return;
			}

			runInAction(() => {
				this._coords = mapService.leafletMap!.getCenter();
			});

			mapService.leafletMap.on('mousemove', (e) => {
				runInAction(() => {
					this._coords = e['latlng'];
				});
			});
			r.dispose();
		})

		makeObservable<ShowCoordinatesTool, '_coords'>(
			this,
			{
				_coords: observable,
				isChangingUnits: observable,
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

export { ShowCoordinatesTool, units };