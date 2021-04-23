import { action, computed, makeObservable, observable } from "mobx";
import { ContainerInstance, Inject, Service } from "typedi";
import { MapService } from "./MapService";
import { Layer } from '../models/Layer';


type CatalogServiceAnnotations = '_layers' | '_ready' | 'setReady';

@Service()
class CatalogService {
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

		makeObservable<CatalogService, CatalogServiceAnnotations>(
			this,
			{
				_layers: observable,
				_ready: observable,
				setReady: action
			}
		);

		(async () => {
			await this.init();
			this.setReady(true);
		})();
	}

	private setReady(isReady: boolean) {
		this._ready = isReady;
	}

	private async init(): Promise<void> {
		// Stack order:  bottom-to-top.
		// fetch('layers.json', {cache: "no-store"})
		// 	.then(response => response.json())
		// 	.then(data =>
		// 		data.forEach((l: Layer) => {
		// 			const layer = new Layer();
		// 			Object.assign(layer, l);
		// 		})
		// 	)

		// TODO:  Fetch layers from folderset xml
	}
}

export { CatalogService };