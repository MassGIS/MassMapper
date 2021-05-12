import { Control, DomUtil, Map } from 'leaflet';
import { autorun, IReactionDisposer } from "mobx";
import { MapService } from "../services/MapService";
import { Tool, ToolPosition } from "./Tool";
import { MeasureToolComponent } from '../components/MeasureToolComponent';
import { ContainerInstance } from 'typedi';

import ruler from '../images/ruler.png';

// import measure from '@tristanhoffmann/leaflet-measure';
// const m = measure;

const MeasureControl = Control.extend({
    onAdd: (map:Map) => {
        const img = DomUtil.create('img') as HTMLImageElement;

        img.src = ruler;
        img.style.width = '24px';

        return img;
    },

    onRemove: (map:Map) => {
        // Nothing to do here
    }
});
class MeasureTool extends Tool {

	// private _measureControl:Control;
	private _measureDisposer:IReactionDisposer;

	constructor(
		protected readonly _services:ContainerInstance,
		public readonly id:string,
		public position: ToolPosition
	) {
		super(_services, id, position);
		const measureControl = new MeasureControl({ position: 'bottomleft' });
		const mapService = _services.get(MapService);
		autorun(() => {
			debugger;
			if (!mapService.ready || !mapService.leafletMap) {
				return;
			}
			debugger;

			measureControl.addTo(mapService.leafletMap);
		})
	}

	public async activate() {
		super.activate();

		const ms = this._services.get(MapService);
		this._measureDisposer = autorun(() => {
			if (!ms.leafletMap || !this._active) {
				return;
			}

			ms.leafletMap.on('click',() => {
				// add a measure point to the map and keep going
				console.log("map clicked");
			});

			ms.leafletMap.on('mousemove', () => {
				console.log("map moved");

			});
		})
	}

	public component() {
		//return MeasureToolComponent;
		return () => null;
	}


	public async deactivate() {
		this._measureDisposer();
	}
}

export { MeasureTool };