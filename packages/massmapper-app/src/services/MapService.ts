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
	LatLngBounds,
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
import north from '../images/north_arrow.png';

@Service()
class MapService {
	get currentScale(): number {
		// https://docs.microsoft.com/en-us/bingmaps/articles/bing-maps-tile-system
		const EARTH_RADIUS = 6378137;
		const SCREEN_PPI = 96;
		// Original OLIVER assumed all scales were calculated at the equator.  Assume the same here so that
		// all layer scaleOK calcs will be identical.
		const centerLat = 0; // this._map.getCenter().lat
		if (this._map) {
			return (Math.cos(centerLat * Math.PI/180) * 2 * Math.PI * EARTH_RADIUS * SCREEN_PPI) /
				(256 * Math.pow(2, this._mapZoom) * 0.0254);
		}
		else {
			return 0;
		}
	}

	get activeBaseLayer() {
		return this._activeBaseLayer;
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
	private _mapExtent: number[] = [0, 0, 0, 0];
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
			),
			pdfOk: true
		},
		{
			name: '2019 Color Orthos (USGS)',
			layer: new TileLayer(
				'https://tiles.arcgis.com/tiles/hGdibHYSPO59RG1h/arcgis/rest/services/USGS_Orthos_2019/MapServer/tile/{z}/{y}/{x}',
				{
					maxZoom: 20
				}
			),
			pdfOk: true
		},
		{
			name: 'USGS Topographic Quadrangle Maps',
			layer: new TileLayer(
				'https://tiles.arcgis.com/tiles/hGdibHYSPO59RG1h/arcgis/rest/services/USGS_Topo_Quad_Maps/MapServer/tile/{z}/{y}/{x}',
				{
					maxZoom: 18
				}
			),
			pdfOk: true
		},
		{
			name: 'OpenStreetMap Basemap',
			layer: new TileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				maxZoom: 19,
				attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
			}),
			pdfOk: true
		},
		{
			name: 'Google Roads Basemap',
			layer: new Leaflet.gridLayer['googleMutant']({
				type: 'roadmap'
			}),
			pdfOK: false
		},
		{
			name: 'Google Satellite Basemap',
			layer: new Leaflet.gridLayer['googleMutant']({
				type: 'satellite'
			}),
			pdfOK: false
		},
		{
			name: 'Google Hybrid Basemap',
			layer: new Leaflet.gridLayer['googleMutant']({
				type: 'hybrid'
			}),
			pdfOK: false
		},
		{
			name: 'Google Terrain Basemap',
			layer: new Leaflet.gridLayer['googleMutant']({
				type: 'terrain'
			}),
			pdfOK: false
		},
		{
			name: 'ESRI Streets Basemap',
			layer: new BasemapLayer('Streets'),
			pdfOk: true
		},
		{
			name: 'ESRI Light Gray Basemap',
			layer: new BasemapLayer('Gray'),
			pdfOk: true
		},
	];
	private _activeBaseLayer = this._basemaps.find((bm) => bm.name === 'MassGIS Statewide Basemap');

	get permalink(): string {
		const layers = Array.from(this._leafletLayers.values()).map(l => l.options!['name'] + '__' + l.options!['style']).join(",");

		return `bl=${encodeURIComponent(this._activeBaseLayer!.name)}&l=${layers}&b=${this._mapExtent}`;
	}

	constructor(private readonly _services: ContainerInstance) {
		this._leafletLayers = new Map<string, TileLayer>();

		makeObservable<MapService, '_map' | '_ready' | '_mapZoom' | '_mapExtent' | '_leafletLayers' | '_activeBaseLayer'>(
			this,
			{
				_activeBaseLayer: observable,
				_leafletLayers: observable,
				_map: observable,
				_mapZoom: observable,
				_mapExtent: observable,
				_ready: observable,
				currentScale: computed,
			}
		);
	}

	public async initLeafletMap(m: LeafletMap, b: number[]): Promise<void> {
		// read the url
		this._map = m;

		// Chrome needs a gentle nudge to create a PDF if a user doesn't interact w/ the map at all.
		// A m.invalidateSize() doesn't seem to do the trick either.
		window.dispatchEvent(new Event('resize'));

		const hs = this._services.get(HistoryService);
		const ls = this._services.get(LegendService);

		// setup the initial extent [lon0, lat0, lon1, lat1]
		this._map.fitBounds(new LatLngBounds(
			new LatLng(b[1], b[0]), 
			new LatLng(b[3], b[2])
		));

		// need to load layers
		autorun((r) => {
			const cs = this._services.get(CatalogService);
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
					v.agol || 'https://giswebservices.massgis.state.ma.us/geoserver/wms',
					v.query || v.name!
				);
				ls.addLayer.bind(ls)(l);
			});

			toAdd.length > 0 && r.dispose();
		});

		new Control.Scale({position: 'bottomleft'}).addTo(m);

		const MS = Control.extend({
			onAdd: function () {
				const div = document.createElement('div');
				div.id = 'map-scale';
				// Copied style from Control.Scale.
				div.style.background = "rgba(255, 255, 255, 0.5)";
				div.style.fontSize = "11px";
				div.style.lineHeight = "1.1";
				div.style.padding = "2px 5px 1px";
				return div;
			},
			onRemove: function () {
			},
		});
		const MapScaleControl = function(opts: Leaflet.ControlOptions | undefined) {
			return new MS(opts);
		};
		MapScaleControl({position: 'bottomleft'}).addTo(this._map);

		const NA = Control.extend({
			onAdd: function () {
				const img = document.createElement('img');
				img.src = north;
				return img;
			},
			onRemove: function () {
			},
		});
		const NorthArrowControl = function(opts: Leaflet.ControlOptions | undefined) {
			return new NA(opts);
		};
		NorthArrowControl({position: 'bottomleft'}).addTo(this._map);

		// clear all layers, if there were any to start
		this._leafletLayers.clear();
		m.eachLayer((l) => {
			m.removeLayer(l);
		});

		m.addEventListener('moveend zoomend', () => {
			this._mapZoom = this._map?.getZoom() || 0;
			this._mapExtent = [
				this.leafletMap?.getBounds().getSouthWest().lng || 0,
				this.leafletMap?.getBounds().getSouthWest().lat || 0,
				this.leafletMap?.getBounds().getNorthEast().lng || 0,
				this.leafletMap?.getBounds().getNorthEast().lat || 0,
			]
			document.getElementById('map-scale')!.innerHTML = '1:' + String(Math.round(this.currentScale)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		});

		m.on('baselayerchange', (e: LayersControlEvent) => {
			this._activeBaseLayer = this._basemaps.find((bm) => bm.name === e.name);
		});

		this._layerControl = new Control.Layers().addTo(this._map);

		// square away the basemaps
		if (hs.has('bl') && this._basemaps.find((o) => {return hs.get('bl') === o.name})) {
			this._activeBaseLayer = this._basemaps.find((bm) => bm.name === hs.get('bl'));
		}
		this._basemaps.forEach((o) => {
			this._layerControl.addBaseLayer(o.layer, o.name);
			if (o.name === this._activeBaseLayer!.name) {
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

		// listen for opacity changes
		autorun(() => {
			ls.enabledLayers.forEach(l => {
				// if (l.opacity !== 100) {
					const leafletLayer = this._leafletLayers.get(l.id);
					leafletLayer?.setOpacity(l.opacity/100);
				// }
			})
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
