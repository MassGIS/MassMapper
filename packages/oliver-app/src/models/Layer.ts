import { computed, makeObservable, observable } from "mobx";
import { MapService } from "../services/MapService";

type LayerAnnotations = '_isLoading' | '_layerData';

type LayerMetadata = {
	minScale: number,
	maxScale: number,
	legendURL: string,
	srcUrl: string,
}

class Layer {
	public readonly id:string;
	public enabled: boolean = false;
	public isLoading: boolean = false;
	public options?: {
		"layers": string,
		"styles": string
	};

	get srcURL(): string {
		//TODO: calculate the source url from the known data
		return this._layerData.srcUrl;
	}
	get legendURL(): string {
		//TODO: calculate the source url from the known data
		return this._layerData.legendURL;
	}
	get minScale(): number {
		return this._layerData.minScale;
	};
	get maxScale(): number {
		return this._layerData.maxScale;
	};
	get scaleOk(): boolean {
		const scale = this._mapService.currentScale;
		return (this.minScale || 0) <= scale && scale <= (this.maxScale || 999999999);
	}


	private _mapService:MapService;
	private _isLoading = false;
	private _layerData: LayerMetadata;

	constructor(
		public readonly name:string,
		public readonly style:string,
		public readonly title:string,
		public readonly shapeType: 'POINT' | 'LINE' | 'POLY',
		public readonly layerType: 'tile' | 'wms'
	) {
		makeObservable<Layer, LayerAnnotations>(
			this,
			{
				_isLoading: observable,
				_layerData: observable,
				isLoading: observable,
				scaleOk: computed,
				enabled: observable
			}
		);
		this.id = 'layer-' + Math.random();
	}

	public makeMappable(mapService:MapService) {
		this._mapService = mapService;
		//TODO: fetch the xml that's needed for this specific layer, store the data in the _layerData object

	}
}

export { Layer };