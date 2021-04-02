import { makeObservable, observable } from "mobx";
import { Service } from "typedi";

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

		makeObservable<LegendService, '_layers' | '_ready'>(
			this,
			{
				_layers: observable,
				_ready: observable
			}
		);

		(async () => {
			await new Promise(resolve => setTimeout(resolve, 1000)); // wait 1 second
			await loadSomeLayers(this);
			this._ready = true;
		})();
	}

	public addLayer(l: Layer): void {
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


const loadSomeLayers =  async (legendService: LegendService) => {
	[ {
		name: "test",
		id: "test-id",
		enabled: true
	},
		{
			name: "another test",
			id: "test-2",
			enabled: true
		},
		{
			name: "layer 3",
			id: "test-3",
			enabled: true
		},
		{
			name: "layer d",
			id: "test-4",
			enabled: true
		} ].forEach((l: Layer) => {
		legendService.addLayer(l);
	});
}