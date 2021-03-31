import { autorun, makeObservable, observable } from "mobx";
import { LegendService } from './LegendService';
import { TileLayer, Map as LeafletMap} from 'leaflet';
import { ContainerInstance, Service } from "typedi";

@Service()
class MapService {
	private _map: LeafletMap | null = null;
	private _ready: boolean = false;
	private _legendService: LegendService;
	private _leafletLayers: Map<string, TileLayer>;

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
		this._leafletLayers = new Map<string,TileLayer>();

		(async () => {
			await new Promise(resolve => setTimeout(resolve, 1000)); // wait 1 second
			this._ready = true;
		})();
	}

	public async initLeafletMap(m:LeafletMap):Promise<void> {
		this._map = m;

		this._leafletLayers.clear();
		// clear all layers, if there were any to start
		m.eachLayer((l) => {
			m.removeLayer(l);
		})


		// after every change to the enabledLayers, sync the layer list to the map
		autorun(() => {
			const toAdd:string[] = [];
			const toDelete:string[] = [];

			const els = this._legendService.enabledLayers;
			els.forEach((l) => {
				if (!this._leafletLayers.has(l.id)) {
					// add layer
					toAdd.push(l.id);
				}
			})

			this._leafletLayers.forEach((ll) => {
				const enabled = els.filter((l) => ll.options.id === l.id);
				if (enabled.length === 0) {
					toDelete.push(ll.options.id!);
				}
			});

			console.log("adding",toAdd);
			toDelete.forEach((id) => {
				const ll = this._leafletLayers.get(id);
				ll && this._map?.removeLayer(ll);
				this._leafletLayers.delete(id);

			});

			console.log("deleting",toAdd);
			toAdd.forEach((id) => {
				const newLayer = this.createLeafletLayer(id);
				this._map?.addLayer(newLayer);
				this._leafletLayers.set(id, newLayer);
			})
		})
	}

	private createLeafletLayer(id:string): TileLayer {
		return new TileLayer(
			'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
			{
				attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
				id
			}
		);
	}
}

export { MapService };
