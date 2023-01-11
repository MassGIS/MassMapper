import { autorun, computed, makeObservable, observable } from "mobx";
import { MapService } from "../services/MapService";
import parser from 'fast-xml-parser';
import he from 'he';
import { TileLayer } from 'leaflet';
import wms from '@2creek/leaflet-wms';

type LayerMetadata = {
	minScale: number,
	maxScale: number,
	srcUrl: string,
	metadataUrl: string,
	minZoom: number,
	maxZoom: number,
	extractDocs: string[],
}

class Layer {
	public readonly id:string;
	public enabled: boolean = false;
	public options?: {
		"layers": string,
		"styles": string
	};

	get isLoading(): boolean {
		return this._isLoading;
	}

	get srcURL(): string {
		//TODO: calculate the source url from the known data
		return this._layerData.srcUrl;
	}
	get legendURL(): string {
		return this.layerType === 'tiled_overlay' ? '' :
			this._gsurl + '/geoserver/wms?' +
			'VERSION=1.1.1&SERVICE=WMS&REQUEST=GetLegendGraphic&EXCEPTIONS=application%2Fvnd.ogc.se_xml&FORMAT=image%2Fgif&' +
			`LAYER=${this.name}&STYLE=${this.customStyle() || this.style}`
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
	get metadataUrl(): string {
		return this._layerData.metadataUrl;
	}
	get extractDocs(): string[] {
		return this._layerData.extractDocs;
	}

	private customStyle(): string {
		const t2s = {
			'tiled_overlay': '',
			'wms': '',
			'pt': 'Points',
			'line': 'Lines',
			'poly': 'Polys'
		};
		if (this.customColor && t2s[this.layerType]) {
			return this.customColor + '_' + t2s[this.layerType];
		}
		return '';
	}

	private _mapService:MapService;
	private _isLoading = false;
	private _layerData: LayerMetadata = {
		srcUrl: '',
		metadataUrl: '',
		minScale: -1,
		maxScale: -1,
		minZoom: 0,
		maxZoom: 18,
		extractDocs: [],
	};
	public customColor?: string;
	public opacity: number = 100;

	constructor(
		public readonly name:string,
		public readonly style:string,
		public readonly title:string,
		public readonly layerType: 'tiled_overlay' | 'wms' | 'pt' | 'line' | 'poly',
		public readonly src:string,
		public readonly queryName:string,
		private readonly _gsurl:string,
	) {
		this.customColor = undefined;
		makeObservable<Layer, '_isLoading' | '_layerData'>(
			this,
			{
				_isLoading: observable,
				_layerData: observable,
				scaleOk: computed,
				enabled: observable,
				isLoading: computed,
				opacity: observable,
				customColor: observable,
			}
		);
		this.id = 'layer-' + Math.random();

		autorun(() => {
			if (this.customColor || !this.customColor) {
				this.enabled = false;
				window.setTimeout(() => {
					this.enabled = true;
				}, 10)
			}
		})
	}

	public async makeMappable(mapService:MapService): Promise<void> {
		this._mapService = mapService;
		this._isLoading = true;
		const layerId = this.name.replace(/:/g,'_') + '.' +
		(
			this.layerType === 'tiled_overlay' ? "" : this.style.replace(/:/g,'_')
		);
		await fetch(`https://maps.massgis.digital.mass.gov/temp/OL_MORIS_cache/${layerId}.xml`, {
			cache: 'no-cache'
		})
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

				// Pull out the metadata URL.  This is a bit messy because sometimes the keywords come in as a single array.
				// Other times as a nested array.
				let murl = undefined;
				let extractDocs = [];
				if (xmlData.KeywordList) {
					murl =
						(xmlData.KeywordList[0].Keyword.find && xmlData.KeywordList[0].Keyword.find(
							(s: string) => /MassgisMetadataUrl/i.test(s)
						)) ||
						(xmlData.KeywordList.find && xmlData.KeywordList.find(
							(s: { Keyword: string; }) => /MassgisMetadataUrl/i.test(s.Keyword)
						));
					if (typeof murl === 'object' && murl !== null) {
						murl = murl.Keyword.split('=')[1];
					}
					else if (typeof murl === 'string') {
						murl = murl.split('=')[1]
					}

					extractDocs =
						(xmlData.KeywordList[0].Keyword.find && xmlData.KeywordList[0].Keyword
							.filter((s:string) => /ExtractDoc/i.test(s))
							.map(
								(s: string) => s.split("=")[1]
							)
						) ||
						(xmlData.KeywordList.find && xmlData.KeywordList
							.filter((s: { Keyword: string; }) => /ExtractDoc/i.test(s.Keyword))
							.map(
								(s: { Keyword: string; }) => s.Keyword.split("=")[1]
							)
						);
				}

				// Assume WMS.
				this._layerData = {
					minScale: xmlData.Scale && xmlData.Scale[0].minScaleDenominator,
					maxScale: xmlData.Scale && xmlData.Scale[0].maxScaleDenominator,
					srcUrl: this.src,
					minZoom: this._layerData.minZoom,
					maxZoom: this._layerData.maxZoom,
					metadataUrl: murl,
					extractDocs
				};

				this.options = {
					layers: this.name,
					styles: this.style
				};
			});

		// If we are type tiled_overlay, the incoming srcUrl points to some metadata we need to fetch to get the srcUrl we really need.
		if (this.layerType === 'tiled_overlay') {
			// Until MassGIS gets CORS.
			await fetch('https://maps.massgis.digital.mass.gov/map_ol/' + this.src.substr(this.src.lastIndexOf('/')))
				.then(response => response.json())
				.then(json => {
					this._layerData.srcUrl = json.tileServers[0] + '/tile/{z}/{y}/{x}';
					if (json.tileInfo?.lods) {
						this._layerData.minZoom = json.tileInfo.lods[0].level;
						this._layerData.maxZoom = json.tileInfo.lods[json.tileInfo.lods.length - 1].level;
					}
				})
		}
	}

	public createLeafletTileLayer(): TileLayer {
		const lyr = new TileLayer(
			this.srcURL,
			{
				id: this.id,
				pane: this.id,
				minZoom: this._layerData.minZoom,
				maxZoom: this._layerData.maxZoom
			}
		);

		lyr.options['name'] = this.options!.layers;
		lyr.options['style'] = this.options!.styles;

		lyr.addEventListener('loading', () => {
			this._isLoading = true;
		});
		lyr.addEventListener('load', () => {
			this._isLoading = false;
		});

		return lyr;
	}

	public createLeafletWMSLayer() {
		let lyr = wms.overlay(
			this.srcURL,
			{
					pane: this.id,
					layers: this.options!.layers,
					styles: this.customStyle() || this.options!.styles,
					transparent: true,
					format: "image/png",
					maxZoom: 20
			}
		);

		// Explicitly set the id since wms.overlay doesn't do this free of charge.
		lyr.options.id = this.id;
		lyr.options.name = this.options!.layers;
		lyr.options.style = this.options!.styles;

		lyr.onLoadStart = () => {
			this._isLoading = true;
		}
		lyr.onLoadEnd = () => {
			this._isLoading = false;
		}

		return lyr;
	}
}

export { Layer };