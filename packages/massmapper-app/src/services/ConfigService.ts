import { autorun, makeObservable, observable } from "mobx";
import { ContainerInstance, Service } from "typedi";
import { ToolDefinition } from "./ToolService";

@Service()
class ConfigService {

	get toolDefs(): ToolDefinition[] {
		return this._config.tools;
	}

	get useXGrid(): boolean {
		return this._config.useXGrid || false;
	}

	get xGridLicenseKey(): string | undefined {
		return this._config.xGridLicenseKey;
	}

	get initialExtent(): [number, number] {
		return this._config.initialExtent || [ 42.067627975,-71.7182675 ]
	}

	get initialZoomLevel(): number {
		return this._config.initialZoomLevel || 8;
	}

	get folderSet():string {
		return this._config.folderSet;
	}

	get ready(): boolean {
		return this._ready;
	}

	private _ready: boolean = false;
	private _config: {
		folderSet: string,
		initialExtent: [number, number],
		initialZoomLevel: number,
		tools: ToolDefinition[],
		useXGrid?: boolean,
		xGridLicenseKey?: string,
	} = {
		folderSet: '',
		initialExtent: [42.067627975,-71.7182675],
		initialZoomLevel: 8,
		tools: []
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

			this._ready = true;
			r.dispose();
		});
	}

}

export { ConfigService };