import { action, makeObservable, observable } from "mobx";
import { ContainerInstance, Service } from "typedi";
import { MapService } from "./MapService";
import { Layer } from '../models/Layer';

type LegendServiceAnnotations = '_layers' | '_ready' | 'setReady';

@Service()
class LegendService {
	get enabledLayers(): Layer[] {
		return this._layers.filter((l) => l.enabled);
	}

	get layers(): Layer[] {
		return this._layers;
	}

	get ready(): boolean {
		return this._ready;
	}

	private readonly _layers: Layer[];
	private _ready: boolean = false;

	public isSplashPageVisible: boolean = true;

	constructor(private readonly _services: ContainerInstance) {
		this._layers = [];

		makeObservable<LegendService, LegendServiceAnnotations>(
			this,
			{
				_layers: observable,
				_ready: observable,
				isSplashPageVisible: observable,
				setReady: action,
			}
		);

		(async () => {
			// await new Promise(resolve => setTimeout(resolve, 1000)); // wait 1 second
			this.setReady(true);
		})();
	}

	public getLayerById(id:string) {
		return this._layers.filter(l => l.id === id)[0]
	}

	public moveLayer(l:Layer, newIndex:number): void {
		const oldIndex = this._layers.indexOf(l);
		array_move(this._layers, oldIndex, newIndex);
	}

	public async addLayer(l: Layer): Promise<void> {
		if (this._layers.filter((layer) => layer.name === l.name && layer.style === l.style).length > 0) {
			// already added
			return;
		}

		const mapService = this._services.get(MapService);
		await l.makeMappable(mapService);
		l.enabled = true;
		this._layers.unshift(l);
	}

	public removeLayer(l: Layer): void {
		const toRemove = this._layers.findIndex((ly) => ly.name === l.name && ly.style === l.style);
		this._layers.splice(toRemove, 1)
	}

	private setReady(isReady: boolean) {
		this._ready = isReady;
	}
}

function array_move(arr:Array<unknown>, old_index: number, new_index: number) {
    if (new_index >= arr.length) {
        var k = new_index - arr.length + 1;
        while (k--) {
            arr.push(undefined);
        }
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
};


export { Layer, LegendService };