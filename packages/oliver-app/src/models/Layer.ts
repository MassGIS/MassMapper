import { computed, makeObservable, observable } from "mobx";
import { MapService } from "../services/MapService";
import parser from 'fast-xml-parser';
import he from 'he';

type LayerAnnotations = '_isLoading' | '_layerData';

type LayerMetadata = {
	minScale: number,
	maxScale: number,
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
		return this.layerType === 'tiled_overlay' ? '' :
			'http://giswebservices.massgis.state.ma.us/geoserver/wms?TRANSPARENT=TRUE&' +
			'VERSION=1.1.1&SERVICE=WMS&REQUEST=GetLegendGraphic&EXCEPTIONS=application%2Fvnd.ogc.se_xml&FORMAT=image%2Fgif&' +
			`LAYER=${this.name}&STYLE=${this.style}`;
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
	private _layerData: LayerMetadata = {
		srcUrl: '',
		minScale: -1,
		maxScale: -1
	};

	constructor(
		public readonly name:string,
		public readonly style:string,
		public readonly title:string,
		public readonly layerType: 'tiled_overlay' | 'wms' | 'pt' | 'line' | 'poly',
		public readonly src:string
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

	public async makeMappable(mapService:MapService): Promise<void> {
		this._mapService = mapService;
		this._isLoading = true;
		const layerId = this.name.replaceAll(':','_') + '.' +
		(
			this.layerType === 'tiled_overlay' ? "" : this.style.replaceAll(':','_')
		);
		await fetch(`/temp/OL_MORIS_cache/${layerId}.xml`)
			.then(response => response.text())
			.then(text => {
				// I don't know how many of these are important!
				const options = {
					attributeNamePrefix: "",
					// attrNodeName: "attrs", //default is 'false'
					// textNodeName : "#text",
					ignoreAttributes: false,
					ignoreNameSpace: true,
					allowBooleanAttributes: false,
					parseNodeValue: false,
					parseAttributeValue: true,
					trimValues: true,
					cdataTagName: "__cdata", //default is 'false'
					cdataPositionChar: "\\c",
					parseTrueNumberOnly: false,
					arrayMode: true, //"strict"
					attrValueProcessor: (val: string, attrName: string) => he.decode(val, { isAttributeValue: true }),//default is a=>a
					tagValueProcessor: (val: string, attrName: string) => he.decode(val) //default is a=>a
				};

				const xmlData = parser.parse(text, options).Layer[0];
				
				// Assume WMS.
				this._layerData = {
					minScale: xmlData.Scale && xmlData.Scale[0].minScaleDenominator,
					maxScale: xmlData.Scale && xmlData.Scale[0].maxScaleDenominator,
					srcUrl: this.src
				};

				this.options = {
					layers: this.name,
					styles: this.style
				};
			});

		// If we are type tiled_overlay, the incoming srcUrl points to some metadata we need to fetch to get the srcUrl we really need.
		if (this.layerType === 'tiled_overlay') {
			// Until MassGIS gets CORS.
			await fetch('/temp/OL_MORIS_cache/' + this.src.substr(this.src.lastIndexOf('/')))
				.then(response => response.json())
				.then(json => {
					this._layerData.srcUrl = json.tileServers[0] + '/tile/{z}/{y}/{x}';
				})
		}
	}
}

export { Layer };