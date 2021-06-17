import {
	DomUtil,
	TileLayer,
	Map as LeafletMap,
	Control,
	LayersControlEvent,
	Layer as LeafletLayer,
	polyline,
	polygon,
	circleMarker,
	LatLng,
} from 'leaflet';
import { autorun, computed, has, makeObservable, observable } from "mobx";
import { ContainerInstance, Service } from "typedi";
import { CatalogService } from './CatalogService';
import { HistoryService } from './HistoryService';
import { LegendService, Layer } from './LegendService';
import { BasemapLayer } from 'esri-leaflet';
import GoogleMutant from 'leaflet.gridlayer.googlemutant';
const g = GoogleMutant; // need this to force webpack to realize we're actually USING this object and to include it in the final bundle
import Leaflet from 'leaflet';
import { SelectionService } from './SelectionService';
import { IdentifyResultFeature } from '../models/IdentifyResults';
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
	private _layerControl:Control.Layers;
	private _selectedFeatures: Array<LeafletLayer> = [];
	private _basemaps = [
		{
			name: 'MassGIS Statewide Basemap',
			layer: new TileLayer(
				'https://tiles.arcgis.com/tiles/hGdibHYSPO59RG1h/arcgis/rest/services/MassGISBasemap/MapServer/tile/{z}/{y}/{x}',
				{
					maxZoom: 19
				}
			)
		},
		{
			name: '2019 Color Orthos (USGS)',
			layer: new TileLayer(
				'https://tiles.arcgis.com/tiles/hGdibHYSPO59RG1h/arcgis/rest/services/USGS_Orthos_2019/MapServer/tile/{z}/{y}/{x}',
				{
					maxZoom: 19
				}
			)
		},
		{
			name: 'USGS Topographic Quadrangle Maps',
			layer: new TileLayer(
				'https://tiles.arcgis.com/tiles/hGdibHYSPO59RG1h/arcgis/rest/services/USGS_Topo_Quad_Maps/MapServer/tile/{z}/{y}/{x}',
				{
					maxZoom: 18
				}
			)
		},
		{
			name: 'OpenStreetMap Basemap',
			layer: new TileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				maxZoom: 19,
				attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
			})
		},
		{
			name: 'Google Roads Basemap',
			layer: new Leaflet.gridLayer['googleMutant']({
				type: 'roadmap'
			})
		},
		{
			name: 'Google Satellite Basemap',
			layer: new Leaflet.gridLayer['googleMutant']({
				type: 'satellite'
			})
		},
		{
			name: 'Google Hybrid Basemap',
			layer: new Leaflet.gridLayer['googleMutant']({
				type: 'hybrid'
			})
		},
		{
			name: 'Google Terrain Basemap',
			layer: new Leaflet.gridLayer['googleMutant']({
				type: 'terrain'
			})
		},
		{
			name: 'ESRI Streets Basemap',
			layer: new BasemapLayer('Streets')
		},
		{
			name: 'ESRI Light Gray Basemap',
			layer: new BasemapLayer('Gray')
		},
	];

	get permalink(): string {
		const zoom = this._mapZoom || '';
		const layers = Array.from(this._leafletLayers.values()).map(l => l.options!['name'] + '__' + l.options!['style']).join(",");

		return `bl=${encodeURIComponent(this._activeBaseLayer)}&l=${layers}&c=${this._mapCenter}&z=${zoom}`;
	}

	constructor(private readonly _services: ContainerInstance) {
		this._leafletLayers = new Map<string, TileLayer>();
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

		// need to load layers
		autorun((r) => {
			const cs = this._services.get(CatalogService);
			const ls = this._services.get(LegendService);
			if (!cs.ready || !ls.ready) {
				return;
			}

			// Add standard overlays if empty permalink (which implies MassGIS basemap).
			let layers = (hs.has('bl') || hs.has('l')) ?
				[] :
				'Basemaps_L3Parcels__'.split(',');

			// Incoming permalink layers override defaults.
			if (hs.has('l')) {
				layers = (hs.get('l') as string).split(',');
			}

			// Only add layers we recognize, according to permalink order.
			let toAdd: any[] = [];
			layers.forEach(l => {
				const catlyr = cs.uniqueLayers.find(cl => {
					return l === cl.name + "__" + cl.style;
				});
				if (catlyr) {
					toAdd.push(catlyr);
				}
			})

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

		// square away the basemaps
		if (hs.has('bl') && this._basemaps.find((o) => {return hs.get('bl') === o.name})) {
			this._activeBaseLayer = '' + hs.get('bl');
		}
		this._basemaps.forEach((o) => {
			this._layerControl.addBaseLayer(o.layer, o.name);
			if (o.name === this._activeBaseLayer) {
				o.layer.addTo(this._map);
			}
		});

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

		// after changes to the selection set, draw the selected feature on the map
		autorun(() => {
			this._selectedFeatures.forEach(f => {
				this._map && f.removeFrom(this._map)
			})
			this._selectedFeatures = [];

			const ss = this._services.get(SelectionService);
			ss.selectedIdentifyResult?.features
				.filter(f => f.isSelected)
				.forEach((f:IdentifyResultFeature ) => {
					let mapFeature;
					if (f.geometry.type === 'Point') {
						mapFeature = circleMarker(
							new LatLng(f.geometry.coordinates[1], f.geometry.coordinates[0]),
							{
								color: "#ffae00",
								fillColor : "#ffae00",
								fillOpacity : .3,
								radius: 17,
							}
						);
					} else if (f.geometry.type === 'Polygon') {
						const latLngs = f.geometry.coordinates[0].map((f:Array<number>) => new LatLng(f[1], f[0]));
						mapFeature = polygon(
							latLngs,
							{
								color: "#ffae00",
								fillColor : "#ffae00",
								fillOpacity : .3,
							});
					} else if (f.geometry.type === 'LineString') {
						const latLngs = f.geometry.coordinates.map((f:Array<number>) => new LatLng(f[1], f[0]));
						mapFeature = polyline(
							latLngs,
							{
								color: "#ffae00",
								weight: 3,
							});
					} else {
						debugger
						return;
					}

					this._map && mapFeature.addTo(this._map);
					this._selectedFeatures.push(mapFeature);
				});
		},{
			delay: 50
		});

		this._ready = true;
	}
}

export { MapService };
