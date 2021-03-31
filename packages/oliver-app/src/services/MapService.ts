import { autorun, makeObservable, observable } from "mobx";
import { Layer, LegendService } from './LegendService';
import { Map } from 'leaflet';
import { ContainerInstance, Service } from "typedi";
@Service()
class MapService {
	private _map: Map | null = null;
	private _ready: boolean = false;
	private _legendService: LegendService;

	get ready():boolean {
		return this._ready;
	}

	constructor(services:ContainerInstance) {
		makeObservable<MapService,'_map' | '_ready'>(
			this,
			{
				_map: observable,
				_ready: observable,
			}
		);

		this._legendService = services.get(LegendService);

		(async () => {
			await new Promise(resolve => setTimeout(resolve, 1000)); // wait 1 second
			this._ready = true;
		})();
	}

	public async initLeafletMap(m:Map):Promise<void> {
		this._map = m;

		autorun(() => {
			this._legendService.enabledLayers.forEach((l) => {
				console.log("adding layer",l,"to map",this._map);
			})
		})

	}

}

export { MapService };
