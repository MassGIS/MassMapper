import { Tool, ToolPosition } from "./Tool";
import { ContainerInstance } from "typedi";
import ExportWizardComponent from "../components/ExportWizardComponent";
import { Layer } from "./Layer";
import { computed, makeObservable, observable, runInAction } from "mobx";
import { IdentifyResult } from "./IdentifyResults";
import { MapService } from "../services/MapService";
import { ConfigService } from "../services/ConfigService";
import proj4 from 'proj4';
import { LegendService } from "../services/LegendService";


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
	public errorMessage?: string;

	public readonly MAX_EXPORT_FEATURES = 25000;

	get exportSupportsProjection(): boolean {
		return this.exportFormat === 'SHAPE-ZIP';
	}

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
			let canExportAnyLayer = false;
			Array.from(this.exportLayersFeatureCount.keys()).forEach((key) => {
				if (this.exportLayersFeatureCount.get(key)! <= this.MAX_EXPORT_FEATURES &&
					this.exportLayersFeatureCount.get(key)! > 0
				) {
					canExportAnyLayer = true;
				}
			})
			return canExportAnyLayer;
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

		this.exportFormat = 'SHAPE-ZIP';
		this.exportCRS = '26986';

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
				isReadyForNextStep: computed,
				exportSupportsProjection: computed
			}
		);

	}

	protected async _deactivate() {
		// no-op
		this.activeStep = undefined;
	}

	protected async _activate() {
		// no-op
	}

	public startExport() {
		this.activeStep = 3;

		const legendService = this._services.get(LegendService);
		this.exportLayers.clear();
		Array.from(legendService.enabledLayers).forEach(l => {
			if (l.layerType !== 'tiled_overlay') {
				this.exportLayers.set(l.name, l);
			}
		});

		this.calculateNumFeatures();
	}

	public component() {
		return ExportWizardComponent;
	}

	public calculateNumFeatures = async () => {

		const mapService = this._services.get(MapService);
		const configService = this._services.get(ConfigService);
		const bbox = mapService.leafletMap!.getBounds()
		const gsurl = configService.geoserverUrl;

		runInAction(() => {
			this.exportLayersFeatureCount.clear();
		});

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

		// await Promise.all(queries).then(() => {
		// 	Array.from(this.exportLayersFeatureCount.keys()).forEach((key) => {
		// 		if (this.exportLayersFeatureCount.get(key)! > this.MAX_EXPORT_FEATURES)
		// 			canDoExport = false;
		// 	})
		// });
	}

	public doExport = async():Promise<void> => {
		this.errorMessage = undefined;
		let xml = '<layers>';
		const bbox = this._services.get(MapService).leafletMap!.getBounds().toBBoxString().split(",");
		const ul = [parseFloat(bbox[0]), parseFloat(bbox[1])];
		const lr = [parseFloat(bbox[2]), parseFloat(bbox[3])];

		const spMeters = "+proj=lcc +lat_1=42.68333333333333 +lat_2=41.71666666666667 +lat_0=41 +lon_0=-71.5 +x_0=200000 +y_0=750000 +ellps=GRS80 +datum=NAD83 +units=m +no_defs";
		const [ulX, ulY] = proj4(spMeters).forward(ul);
		const [lrX, lrY] = proj4(spMeters).forward(lr);

		const bbox26986 = `${ulX} ${ulY} ${ulX} ${lrY} ${lrX} ${lrY} ${lrX} ${ulY} ${ulX} ${ulY}`;
		// Not sure why the following works, unless ul and lr were inverted?
		const bbox26986String = `${ulX},${ulY},${lrX},${lrY}`;
		const configService = this._services.get(ConfigService);
		Array.from(this.exportLayers.values()).forEach(element => {
			if (this.exportLayersFeatureCount.get(element.name)! >= this.MAX_EXPORT_FEATURES) {
				console.debug("too many features in layer", element.name);
				return;
			}

			if (this.exportLayersFeatureCount.get(element.name) === 0) {
				console.debug("no features in layer", element.name);
				return;
			}

			let url = `${configService.geoserverUrl}/geoserver/wfs?request=getfeature` +
				`&version=1.1.0&outputformat=${this.exportFormat}&service=wfs&typename=${element.queryName}` +
				`&filter=<ogc:Filter xmlns:ogc=\"http://ogc.org\" xmlns:gml=\"http://www.opengis.net/gml\"><ogc:Intersects><ogc:PropertyName>shape</ogc:PropertyName><gml:Polygon xmlns:gml=\"http://www.opengis.net/gml\" srsName=\"EPSG:26986\"><gml:exterior><gml:LinearRing><gml:posList>${bbox26986}</gml:posList></gml:LinearRing></gml:exterior></gml:Polygon></ogc:Intersects></ogc:Filter>` +
				`&SRSNAME=EPSG:${this.exportCRS}`;
			if (this.exportFormat === 'kml') {
				url = `${configService.geoserverUrl}/geoserver/wms?request=getmap` +
					`&version=1.1.0&format=application/vnd.google-earth.kml+xml&service=wms&height=100&width=100&styles=&srs=EPSG:26986` +
					`&layers=${element.queryName}&bbox=${bbox26986String}`;
			}
			let layer = `<layer wmsStyle="${this.encodeSpecialChars(element.style)}" wmsLayer="${this.encodeSpecialChars(element.name).replace('massgis:', '')}" name="${this.encodeSpecialChars(element.title)}" baseURL="${this.encodeSpecialChars(url.replace('https', 'http'))}">`;
			layer += '<metadata>' + this.encodeSpecialChars(element.metadataUrl) + '</metadata>';
			element.extractDocs.forEach((url:string) => {
				layer += '<metadata>' + this.encodeSpecialChars(url) + '</metadata>';
			});
			layer += '</layer>';
			xml += layer;
		});

		xml +=`<zip name="${this.exportFileName}" /></layers>`;

		let res;
		try {
			res = await fetch('/cgi-bin/mkzip', {
				method : "POST",
				headers: {
					'Content-Type':'application/xml; charset=UTF-8'
				},
				body: xml,
			});

			if (!res.ok || res.status !== 200) {
				// there was an error.  Crap.
				runInAction(() => {
					this.activeStep = 4
					this.errorMessage = 'There was an error performing the extract.  Please try again.';
				});
				return;
			}

			this.exportFileUrl = await res.text();
			runInAction(() => {
				this.activeStep = 6;
			})
		} catch (e) {
			runInAction(() => {
				this.activeStep = 4
				this.errorMessage = 'There was an error performing the extract.  Please try again.';
			});
			return;
		}
	}

	private encodeSpecialChars(s:string):string {
		return s.replace(/&/g,'___AMP___')
			.replace(/</g,'___LT___')
			.replace(/>/g,'___GT___')
			.replace(/=/g,'___EQ___')
			.replace(/"/g,'___QUOT___');
	}
}


export { ExportWizardTool };