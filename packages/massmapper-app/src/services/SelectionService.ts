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

	public selectedIdentifyResult?: IdentifyResult;

	private readonly _idResults: Map<string, IdentifyResult>;

	constructor(private readonly _services: ContainerInstance) {
		this._idResults = new Map<string,IdentifyResult>();
		this.selectedIdentifyResult = undefined;

		makeObservable<SelectionService, '_idResults'>(
			this,
			{
				_idResults: observable,
				selectedIdentifyResult: observable,
			}
		);

		(async () => {
			// init here
		})();
	}

	public addIdentifyResult(layer: Layer, bbox: LatLngBounds) {
		const idResult = new IdentifyResult(
			layer,
			bbox
		);
		idResult.getNumFeatures()
		this._idResults.set(layer.id, idResult);
	}

	public clearIdentifyResults(): void {
		this._idResults.clear();
	}

}

export { SelectionService };