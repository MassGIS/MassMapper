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

	public async addLayer(l: Layer): Promise<void> {
		if (this._layers.filter((layer) => layer.name === l.name && layer.style === l.style).length > 0) {
			// already added
			return;
		}

		const mapService = this._services.get(MapService);
		await l.makeMappable(mapService);
		l.enabled = true;
		this._layers.push(l);
	}

	public removeLayer(l: Layer): void {
		const toRemove = this._layers.findIndex((ly) => ly.name === l.name && ly.style === l.style);
		this._layers.splice(toRemove, 1)
	}

	private setReady(isReady: boolean) {
		this._ready = isReady;
	}
}

export { Layer, LegendService };