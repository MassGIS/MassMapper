import { DomUtil, TileLayer, Map as LeafletMap, Control, LayersControlEvent } from 'leaflet';
import { autorun, computed, makeObservable, observable } from "mobx";
import { ContainerInstance, Service } from "typedi";
import { CatalogService } from './CatalogService';
import { HistoryService } from './HistoryService';
import { LegendService, Layer } from './LegendService';

@Service()
class MapService {
	get currentScale(): number {
		// https://docs.microsoft.com/en-us/bingmaps/articles/bing-maps-tile-system
		const EARTH_RADIUS = 6378137;
		const SCREEN_PPI = 96;
		if (this._map) {
			return (Math.cos(this._map.getCenter().lat * Math.PI/180) * 2 * Math.PI * EARTH_RADIUS * SCREEN_PPI) /
				(256 * Math.pow(2, this._mapZoom) * 0.0254);
		}
		else {
			return 0;
		}
	}

	get ready(): boolean {
		return this._ready;
	}

	get leafletMap(): LeafletMap | null {
		return this._map;
	}

	private _leafletLayers: Map<string, TileLayer>;
	private _map: LeafletMap | null = null;
	private _ready: boolean = false;
	private _mapZoom: number = 0;
	private _mapCenter: string = '';
	private _activeBaseLayer: string;
	private _baselayers:Map<string, TileLayer>;
	private _layerControl:Control.Layers;

	get permalink(): string {
		const zoom = this._mapZoom || '';
		const layers = Array.from(this._leafletLayers.values()).map(l => l.options!['name'] + '__' + l.options!['style']).join(",");

		return `bl=${this._activeBaseLayer}&l=${layers}&c=${this._mapCenter}&z=${zoom}`;
	}

	constructor(private readonly _services: ContainerInstance) {
		this._leafletLayers = new Map<string, TileLayer>();
		this._baselayers = new Map<string, TileLayer>();
		this._activeBaseLayer = 'MassGIS Statewide Basemap';

		makeObservable<MapService, '_map' | '_ready' | '_mapZoom' | '_mapCenter' | '_leafletLayers' | '_activeBaseLayer'>(
			this,
			{
				_activeBaseLayer: observable,
				_leafletLayers: observable,
				_map: observable,
				_mapCenter: observable,
				_mapZoom: observable,
				_ready: observable,
				currentScale: computed,
			}
		);
	}

	public async initLeafletMap(m: LeafletMap): Promise<void> {
		// read the url
		this._map = m;

		const hs = this._services.get(HistoryService);
		if (hs.has("l")) {
			// need to load layers
			autorun((r) => {
				const cs = this._services.get(CatalogService);
				const ls = this._services.get(LegendService);
				if (!cs.ready || !ls.ready) {
					return;
				}

				const layers = (hs.get('l') as string).split(',');

				const toAdd = cs.uniqueLayers.filter(l => {
					return layers.includes(l.name + "__" + l.style);
				});
				toAdd.forEach((v) => {
					const l = new Layer(
						v.name!,
						v.style!,
						v.title!,
						v.type!,
						v.agol || 'http://giswebservices.massgis.state.ma.us/geoserver/wms'
					);
					ls.addLayer.bind(ls)(l);
				});

				toAdd.length > 0 && r.dispose();
			})
		}

		new Control.Scale({position: 'bottomright'}).addTo(m);

		this._leafletLayers.clear();

		// clear all layers, if there were any to start
		m.eachLayer((l) => {
			m.removeLayer(l);
		});

		m.addEventListener('moveend zoomend', () => {
			this._mapZoom = this._map?.getZoom() || 0;
			this._mapCenter = this.leafletMap?.getCenter().lat + ',' + this.leafletMap?.getCenter().lng;
		});

		m.on('baselayerchange', (e: LayersControlEvent) => {
			this._activeBaseLayer = e.name;
		});

		this._layerControl = new Control.Layers().addTo(this._map);

		const mgis_bm = new TileLayer(
			'https://tiles.arcgis.com/tiles/hGdibHYSPO59RG1h/arcgis/rest/services/MassGIS_Topographic_Features_for_Basemap/MapServer/tile/{z}/{y}/{x}'
		);
		if (!hs.has('bl') || hs.get('bl') === 'MassGIS Statewide Basemap') {
			mgis_bm.addTo(this._map);
			this._activeBaseLayer = 'MassGIS Statewide Basemap';
		}
		this._layerControl.addBaseLayer(mgis_bm, 'MassGIS Statewide Basemap');

		const osm_bm = new TileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			maxZoom: 19,
			attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
		});
		if (hs.has('bl') && hs.get('bl') === 'OpenStreetMap Basemap') {
			this._activeBaseLayer = 'OpenStreetMap Basemap';
			osm_bm.addTo(this._map);
		}
		this._layerControl.addBaseLayer(osm_bm, 'OpenStreetMap Basemap');




		// autorun(() => {
		// 	const zoom = this._mapZoom || '';
		// 	const hs = this._services.get(HistoryService);

		// 	hs.set('bl', this._activeBaseLayer);
		// 	hs.set('l', Array.from(this._leafletLayers.values()).map(l => l.options!['name']).join(","));
		// 	hs.set('c', this._mapCenter);
		// 	hs.set('z', zoom + '');
		// });

		// after every change to the enabledLayers, sync the layer list to the map
		autorun(() => {
			const toAdd: Layer[] = [];
			const toDelete: string[] = [];

			const legendService = this._services.get(LegendService);
			const els = legendService.enabledLayers;

			els.forEach((l) => {
				if (!this._leafletLayers.has(l.id)) {
					// add layer
					toAdd.push(l);
				}
			});

			this._leafletLayers.forEach((ll) => {
				const enabled = els.filter((l) => ll.options.id === l.id);
				if (enabled.length === 0) {
					toDelete.push(ll.options.id!);
				}
			});

			toDelete.forEach((id) => {
				const ll = this._leafletLayers.get(id);
				ll && this._map?.removeLayer(ll);

				const pane = this._map?.getPane(id);

				if (pane) {
					DomUtil.remove(pane);
				} else {
					console.error(`No pane for layer with id '${id}'.`);
				}

				this._leafletLayers.delete(id);
			});

			toAdd.forEach((l) => {
				const { id, layerType: type  } = l;
				this._map?.createPane(id);

				if (type === 'tiled_overlay') {
					const newLayer = l.createLeafletTileLayer();
					this._map?.addLayer(newLayer);
					this._leafletLayers.set(id, newLayer);
				}
				else if (['wms', 'pt', 'line', 'poly'].indexOf(type) >= 0) {
					const newLayer = l.createLeafletWMSLayer();
					this._map?.addLayer(newLayer);
					this._leafletLayers.set(id, newLayer);
				}
			});

			els.forEach((l, index) => {
				const pane = this._map?.getPane(l.id);

				if (pane) {
					// .leaflet-tile-pane ends at zIndex of 399 (.leaflet-overlay-pane @ 400).
					pane.style.zIndex = `${399 - index}`;
				} else {
					console.error(`No pane for layer with id '${l.id}'.`);
				}
			});

			// Line up ancillary scale info.
			this._map?.fireEvent('moveend');
		});

		this._ready = true;
	}
}

export { MapService };
