import { action, autorun, makeObservable, observable, runInAction } from "mobx";
import { ContainerInstance, Service } from "typedi";
import { MapService } from "./MapService";
import { ConfigService } from "./ConfigService";
import { Layer } from '../models/Layer';
// import ua from 'universal-analytics';
import mpanalytics from 'mpanalytics';
import { v4 as uuid } from 'uuid';

type LegendServiceAnnotations = '_layers' | '_ready' | 'setReady';

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

	private readonly _layers: Layer[] = [];
	private _ready: boolean = false;
	private _splashPageContent: string;
	get splashPageContent() : string {
		return this._splashPageContent;
	}

	public isSplashPageVisible: boolean = true;

	private _visitor?;

	constructor(private readonly _services: ContainerInstance) {

		const configService = this._services.get(ConfigService)
		autorun((r) => {
			if (configService.ready) {
				this._visitor = mpanalytics.create({
					tid: configService.googleAnalyticsUA,
					cid: uuid(),
					sampleRate: 100
				})
				r.dispose();
			}
		})

		makeObservable<LegendService, LegendServiceAnnotations>(
			this,
			{
				_layers: observable,
				_ready: observable,
				isSplashPageVisible: observable,
				setReady: action,
			}
		);

		(async () => {
			const pathParts = document.location.pathname.split('/');
			const fileName = pathParts[pathParts.length - 1];
			fetch(`${fileName.split('.')[0]}-splashpage.txt?${Math.random()}`).then(async (r) =>  {
				this._splashPageContent = await r.text();
				const lastSplashPageHash = localStorage.getItem('massmapper.splashPageSize');
				const userSaysSkip = localStorage.getItem('massmapper.skipSplashPage') === 'yes';
				if (lastSplashPageHash === ("" + this._splashPageContent.length) && userSaysSkip) {
					runInAction(() => {
						this.isSplashPageVisible = false;
					})
				} else {
					localStorage.removeItem('massmapper.skipSplashPage');
					localStorage.setItem('massmapper.splashPageSize', this._splashPageContent.length + "");
				}

				this.setReady(true);
			});
		})();
	}

	public getLayerById(id:string) {
		return this._layers.filter(l => l.id === id)[0]
	}

	public moveLayer(l:Layer, newIndex:number): void {
		const oldIndex = this._layers.indexOf(l);
		array_move(this._layers, oldIndex, newIndex);
	}

	public async addLayer(l: Layer): Promise<void> {
		if (this._layers.filter((layer) => layer.name === l.name && layer.style === l.style).length > 0) {
			// already added
			return;
		}

		if (this._visitor) {
			// this._visitor.pageview(document.location.pathname, document.location.href, document.title).send();
			// this._visitor.event("MassMapperAction","LayerAdd","LayerName",l.name).send();
			this._visitor.event({
				category: "MassMapper::LayerAdd",
				action: l.name,
			}, (error:any, body:any) => {
				if (error) {
					console.error(error);
				}
			})
		}

		const mapService = this._services.get(MapService);
		await l.makeMappable(mapService);
		l.enabled = true;
		runInAction(() => {
			this._layers.unshift(l);
		});
	}

	public removeLayer(l: Layer): void {
		const toRemove = this._layers.findIndex((ly) => ly.name === l.name && ly.style === l.style);
		this._layers.splice(toRemove, 1)
	}

	private setReady(isReady: boolean) {
		this._ready = isReady;
	}
}

function array_move(arr:Array<unknown>, old_index: number, new_index: number) {
    if (new_index >= arr.length) {
        var k = new_index - arr.length + 1;
        while (k--) {
            arr.push(undefined);
        }
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
};


export { Layer, LegendService };