import { makeObservable, observable } from "mobx";
import { ContainerInstance, Service } from "typedi";
import { IdentifyResult } from "../models/IdentifyResults";
import { LatLngBounds } from "leaflet";
import { Layer } from "../models/Layer";
import * as turf from '@turf/turf';
import { ConfigService } from "./ConfigService";

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

	public addIdentifyResult(layer: Layer, bbox: LatLngBounds): IdentifyResult {
		const configService = this._services.get(ConfigService);
		const idResult = new IdentifyResult(
			layer,
			bbox,
			configService.geoserverUrl,
		);
		idResult.getNumFeatures()
		this._idResults.set(layer.id, idResult);
		return idResult;
	}

	public clearIdentifyResults(): void {
		this._idResults.clear();
	}

}

export { SelectionService };