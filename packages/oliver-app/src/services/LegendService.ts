import { action, makeObservable, observable } from "mobx";
import { Service } from "typedi";

class Layer {
	public name: string;
	public id: string;
	public enabled: boolean;
	public srcURL: string;
	public legendURL?: string;
}

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

	private readonly _layers: Layer[];
	private _ready: boolean = false;

	constructor() {
		this._layers = [];

		makeObservable<LegendService, LegendServiceAnnotations>(
			this,
			{
				_layers: observable,
				_ready: observable,
				setReady: action
			}
		);

		(async () => {
			await new Promise(resolve => setTimeout(resolve, 1000)); // wait 1 second
			await loadSomeLayers(this);
			this.setReady(true);
		})();
	}

	public addLayer(l: Layer): void {
		this._layers.push(l);
	}

	private setReady(isReady: boolean) {
		this._ready = isReady;
	}
}

const loadSomeLayers =  async (legendService: LegendService) => {
	// Need to tie each layer to a z-indexed map pane.
	[ 
		{
			name: "Basemap",
			id: "basemap",
			srcURL: "https://tiles.arcgis.com/tiles/hGdibHYSPO59RG1h/arcgis/rest/services/MassGIS_Topographic_Features_for_Basemap/MapServer/tile/{z}/{y}/{x}",
			legendURL: "http://giswebservices.massgis.state.ma.us/geoserver/wms?TRANSPARENT=TRUE&STYLE=GISDATA.CENSUS1990BLOCKGROUPS_POLY%3A%3ADefault&FOO=Census%201990%20Block%20Groups&VERSION=1.1.1&SERVICE=WMS&REQUEST=GetLegendGraphic&EXCEPTIONS=application%2Fvnd.ogc.se_xml&LAYER=massgis%3AGISDATA.CENSUS1990BLOCKGROUPS_POLY&SCALE=72223.81928599995&FORMAT=image%2Fgif",
			enabled: true
		},
		{
			name: "Overlay",
			id: "overlay",
			srcURL: "https://tiles1.arcgis.com/tiles/hGdibHYSPO59RG1h/arcgis/rest/services/MassGIS_Basemap_Detailed_Features/MapServer/tile/{z}/{y}/{x}",
			legendURL: "http://giswebservices.massgis.state.ma.us/geoserver/wms?TRANSPARENT=TRUE&STYLE=GISDATA.CENSUS1990BLOCKGROUPS_POLY%3A%3ADefault&FOO=Census%201990%20Block%20Groups&VERSION=1.1.1&SERVICE=WMS&REQUEST=GetLegendGraphic&EXCEPTIONS=application%2Fvnd.ogc.se_xml&LAYER=massgis%3AGISDATA.CENSUS1990BLOCKGROUPS_POLY&SCALE=72223.81928599995&FORMAT=image%2Fgif",
			enabled: true
		},
	].forEach((l: Layer) => {
		legendService.addLayer(l);
	});
}

export { Layer, LegendService };