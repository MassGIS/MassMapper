import { action, makeObservable, observable } from "mobx";
import { Service } from "typedi";

class Layer {
	public name: string;
	public id: string;
	public enabled: boolean;
	public srcURL: string;
	public legendURL?: string;
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

	constructor() {
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
			await loadSomeLayers(this);
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

const loadSomeLayers =  async (legendService: LegendService) => {
	// Stack order:  bottom-to-top.
	fetch('layers.json')
		.then(response => response.json())
		.then(data => 
			data.forEach((l: Layer) => {
				legendService.addLayer(l);
			})
		)
}

export { Layer, LegendService };