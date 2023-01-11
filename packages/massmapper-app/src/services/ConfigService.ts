import { autorun, makeObservable, observable, runInAction } from "mobx";
import { ContainerInstance, Service } from "typedi";
import { ToolDefinition } from "./ToolService";

import massmapper from '../images/massmapper.png';

@Service()
class ConfigService {

	get googleAnalyticsUA(): string | undefined {
		return this._config.googleAnalyticsUA;
	}

	get geoserverUrl(): string {
		return this._config.geoserverUrl;
	}

	get toolDefs(): ToolDefinition[] {
		return this._config.tools;
	}

	get useXGrid(): boolean {
		return this._config.useXGrid || false;
	}

	get xGridLicenseKey(): string | undefined {
		return this._config.xGridLicenseKey;
	}

	get initialExtent(): [number, number, number, number] {
		return this._config.initialExtent || [ -73.508142, 41.237964, -69.928393, 42.886589 ]
	}

	get splashImage(): string {
		return this._config.splashImage || massmapper;
	}

	get splashImageHeight(): string {
		return this._config.splashImageHeight || '';
	}

	get availableBasemaps(): string[] {
		return this._config.availableBasemaps || [
			'MassGIS Basemap',
			'2021 Aerial Imagery',
			'2019 Aerial Imagery',
			'USGS Topographic Quadrangle Maps',
			'OpenStreetMap Basemap',
			'Google Roads Basemap',
			'Google Satellite Basemap',
			'Google Hybrid Basemap',
			'Google Terrain Basemap',
			'ESRI Streets Basemap',
			'ESRI Light Gray Basemap'
		];
	}

	get defaultLayers(): string[] {
		return this._config.defaultLayers || [
			"Basemaps_L3Parcels____ON__100"
		]
	}

	get folderSet():string {
		return this._config.folderSet;
	}

	get ready(): boolean {
		return this._ready;
	}

	private _ready: boolean = false;
	private _config: {
		geoserverUrl: string,
		folderSet: string,
		initialExtent: [number, number, number, number],
		tools: ToolDefinition[],
		availableBasemaps: string[],
		defaultLayers: string[],
		useXGrid?: boolean,
		xGridLicenseKey?: string,
		splashImage?: string,
		splashImageHeight?: string,
		googleAnalyticsUA?: string,
	} = {
		geoserverUrl: 'https://gis-prod.digital.mass.gov',
		folderSet: '',
		initialExtent: [-73.508142, 41.237964, -69.928393, 42.886589],
		tools: [],
		availableBasemaps: [
			'MassGIS Basemap',
			'2021 Aerial Imagery',
			'2019 Aerial Imagery',
			'USGS Topographic Quadrangle Maps',
			'OpenStreetMap Basemap',
			'Google Roads Basemap',
			'Google Satellite Basemap',
			'Google Hybrid Basemap',
			'Google Terrain Basemap',
			'ESRI Streets Basemap',
			'ESRI Light Gray Basemap'
		],
		"defaultLayers": [
			"Basemaps_L3Parcels____ON__100"
		]
	};

	constructor(private readonly _services: ContainerInstance) {
		makeObservable<ConfigService, '_ready'>(
			this,
			{
				_ready: observable
			}
		);

		autorun(async (r) => {
			// load config based on our file name
			const pathParts = document.location.pathname.split('/');
			const fileName = pathParts[pathParts.length - 1];
			const resp = await fetch(
				`config/${fileName.split('.')[0]}.json`,
				{
					'cache': 'no-cache'
				}
			);

			this._config = await resp.json() as any;
			runInAction(() => {
				this._ready = true;
			});

			r.dispose();
		});
	}

}

export { ConfigService };
