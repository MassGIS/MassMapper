import { action, computed, makeObservable, observable } from "mobx";
import { ContainerInstance, Inject, Service } from "typedi";
import { MapService } from "./MapService";

class Layer {
	public name: string;
	public id: string;
	public enabled: boolean = false;
	public srcURL: string;
	public type: string;
	public options?: {
		"layers": string,
		"styles": string
	};
	public legendURL?: string;
	public minScale?: number;
	public maxScale?: number;
	get scaleOk(): boolean {
		const scale = this._mapService.currentScale;
		return (this.minScale || 0) <= scale && scale <= (this.maxScale || 999999999);
	}
	public isLoading: boolean = false;

	// private _mapService:MapService;

	constructor(private _mapService:MapService) {
		// this._mapService = mapService;
		makeObservable<Layer>(
			this,
			{
				isLoading: observable,
				scaleOk: computed,
				enabled: observable
			}
		);
	}
}

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

	constructor(services: ContainerInstance) {
		this._layers = [];

		makeObservable<LegendService, LegendServiceAnnotations>(
			this,
			{
				_layers: observable,
				_ready: observable,
				setReady: action
			}
		);

		(async () => {
			await new Promise(resolve => setTimeout(resolve, 1000)); // wait 1 second
			const mapService = services.get(MapService);
			await loadSomeLayers(this, mapService);
			this.setReady(true);
		})();
	}

	public addLayer(l: Layer): void {
		this._layers.push(l);
	}

	private setReady(isReady: boolean) {
		this._ready = isReady;
	}
}

const loadSomeLayers =  async (legendService: LegendService, mapService: MapService) => {
	// Stack order:  bottom-to-top.
	fetch('layers.json', {cache: "no-store"})
		.then(response => response.json())
		.then(data =>
			data.forEach((l: Layer) => {
				const layer = new Layer(mapService);
				Object.assign(layer, l);
				legendService.addLayer(layer);
			})
		)
}

export { Layer, LegendService };