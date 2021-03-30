import { autorun, computed, makeObservable, observable } from "mobx";

class LegendService {
	private _layers: Layer[];
	private _ready: boolean = false;

	get layers():Layer[] {
		return this._layers;
	}

	get enabledLayers():Layer[] {
		return this._layers.filter((l) => l.enabled);
	}

	get ready():boolean {
		return this._ready;
	}

	constructor() {
		this._layers = [];

		makeObservable<LegendService,'_layers' | '_ready'>(
			this,
			{
				_layers: observable,
				_ready: observable,
				layers: computed,
			}
		);

		autorun(async () => {
			await new Promise(resolve => setTimeout(resolve, 1000)); // wait 1 second
			this._ready = true;
		})
	}

	public async addLayer(l:Layer):Promise<void> {
		this._layers.push(l);
	}

}

class Layer {
	public name: string;
	public id: string;
	public enabled: boolean;
	public legendURL?: string;
}

export { Layer, LegendService };
