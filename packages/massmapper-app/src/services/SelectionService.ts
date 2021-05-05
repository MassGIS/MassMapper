import { makeObservable, observable } from "mobx";
import { ContainerInstance, Service } from "typedi";
import { IdentifyResult } from "../models/IdentifyResults";
import { LatLngBounds } from "leaflet";
import { Layer } from "../models/Layer";

@Service()
class SelectionService {

	get identifyResults(): IdentifyResult[] {
		return Array.from(this._idResults.values());
	}

	get ready(): boolean {
		return this._ready;
	}

	private readonly _idResults: Map<string, IdentifyResult>;
	private _ready: boolean = false;

	constructor(private readonly _services: ContainerInstance) {
		this._idResults = new Map<string,IdentifyResult>();

		makeObservable<SelectionService, '_idResults'>(
			this,
			{
				_idResults: observable
			}
		);

		(async () => {
			// init here
		})();
	}

	public addIdentifyResult(layer: Layer, bbox: LatLngBounds) {
		const idResult = new IdentifyResult(
			layer
		);
		idResult.getNumFeatures(bbox)
		this._idResults.set(layer.id, idResult);
	}

	public clearIdentifyResults(): void {
		this._idResults.clear();
	}

}

export { SelectionService };