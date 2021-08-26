import { Tool, ToolPosition } from "./Tool";
import { ContainerInstance } from "typedi";
import ExportWizardComponent from "../components/ExportWizardComponent";
import { Layer } from "./Layer";
import { computed, makeObservable, observable, runInAction } from "mobx";
import { LatLngBounds } from "leaflet";
import { IdentifyResult } from "./IdentifyResults";
import { MapService } from "../services/MapService";
import { ConfigService } from "../services/ConfigService";


class ExportWizardTool extends Tool {

	protected _isButton = true;
	public activeStep: number|undefined = undefined;
	public exportFileUrl?: string = undefined;
	public exportFileName?: string = undefined;
	public exportFormat?: string = '';
	public exportCRS?: string = '';
	public exportLayers: Map<string,Layer> = new Map();
	public exportLayersFeatureCount: Map<string, number> = new Map();
	public isExporting: boolean = false;

	public readonly MAX_EXPORT_FEATURES = 25000;

	get isReadyForNextStep(): boolean {
		const currentStep = this.activeStep;
		if (currentStep === 1) {
			return true;
		}

		if (currentStep === 2) {
			if (this.exportLayers.size > 0) {
				return true;
			}
		} else if (currentStep === 3) {
			let canExport = true;
			Array.from(this.exportLayersFeatureCount.keys()).forEach((key) => {
				if (this.exportLayersFeatureCount.get(key)! > this.MAX_EXPORT_FEATURES) {
					canExport = false;
				}
			})
			return canExport;
		} else if (currentStep === 4) {
			return !!this.exportFileName && !!this.exportCRS && !!this.exportFormat;
		}

		return false;
	}

	constructor(
		protected readonly _services:ContainerInstance,
		public readonly id:string,
		public position: ToolPosition,
		public readonly options:any
	) {
		super(_services,id,position,options);

		makeObservable<ExportWizardTool>(
			this,
			{
				activeStep: observable,
				exportCRS: observable,
				exportFileUrl: observable,
				exportFileName: observable,
				exportFormat: observable,
				exportLayers: observable,
				exportLayersFeatureCount: observable,
				isExporting: observable,
				isReadyForNextStep: computed
			}
		);

	}

	protected async _deactivate() {
		// no-op
	}

	protected async _activate() {
		// no-op
	}

	public component() {
		return ExportWizardComponent;
	}

	public calculateNumFeatures = async ():Promise<boolean> => {

		const mapService = this._services.get(MapService);
		const configService = this._services.get(ConfigService);
		const bbox = mapService.leafletMap!.getBounds()
		const gsurl = configService.geoserverUrl;

		runInAction(() => {
			this.exportLayersFeatureCount.clear();
		});

		let canDoExport = true;
		const queries:any[] = [];
		Array.from(this.exportLayers).forEach(async ([name, layer]) => {
			const idResults = new IdentifyResult(
				layer,
				bbox,
				gsurl
			);

			const idResult = idResults.getNumFeatures();
			queries.push(idResult);
			const numFeatures = await idResult;
			runInAction(() => {
				this.exportLayersFeatureCount.set(layer.name, numFeatures);
			});
		});

		await Promise.all(queries).then(() => {
			Array.from(this.exportLayersFeatureCount.keys()).forEach((key) => {
				if (this.exportLayersFeatureCount.get(key)! > this.MAX_EXPORT_FEATURES)
					canDoExport = false;
			})
		});

		return canDoExport;
	}
}


export { ExportWizardTool };