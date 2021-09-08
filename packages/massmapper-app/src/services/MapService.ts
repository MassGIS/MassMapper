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
	extend
} from 'leaflet';
import { autorun, computed, makeObservable, observable, runInAction } from "mobx";
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
import { ConfigService } from './ConfigService';
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
			name: 'MassGIS Basemap',
			layer: new TileLayer(
				'https://tiles.arcgis.com/tiles/hGdibHYSPO59RG1h/arcgis/rest/services/MassGISBasemap/MapServer/tile/{z}/{y}/{x}',
				{
					maxZoom: 19,
					minZoom: 7
				}
			),
			pdfOk: true
		},
		{
			name: '2019 Aerial Imagery',
			layer: new TileLayer(
				'https://tiles.arcgis.com/tiles/hGdibHYSPO59RG1h/arcgis/rest/services/USGS_Orthos_2019/MapServer/tile/{z}/{y}/{x}',
				{
					maxZoom: 20,
					minZoom: 7
				}
			),
			pdfOk: true
		},
		{
			name: 'USGS Topographic Quadrangle Maps',
			layer: new TileLayer(
				'https://tiles.arcgis.com/tiles/hGdibHYSPO59RG1h/arcgis/rest/services/USGS_Topo_Quad_Maps/MapServer/tile/{z}/{y}/{x}',
				{
					maxZoom: 18,
					minZoom: 12
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
	private _activeBaseLayer: any = {};

	get permalink(): string {
		const layers = this._services.get(LegendService).layers.map(
			l => l.name + '__' + l.style + '__' + (l.enabled ? 'ON' : 'OFF') + '__' + l.opacity
		).join(",");

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

		runInAction(() => {
			this._map = m;
		})

		// Chrome needs a gentle nudge to create a PDF if a user doesn't interact w/ the map at all.
		// A m.invalidateSize() doesn't seem to do the trick either.
		window.dispatchEvent(new Event('resize'));

		const hs = this._services.get(HistoryService);
		const ls = this._services.get(LegendService);
		const cs = this._services.get(ConfigService);
		const cat = this._services.get(CatalogService);

		// setup the initial extent [lon0, lat0, lon1, lat1]
		this._map!.fitBounds(new LatLngBounds(
			new LatLng(b[1], b[0]),
			new LatLng(b[3], b[2])
		));

		// need to load layers
		autorun(async (r) => {
			if (!cat.ready || !cs.ready || !ls.ready) {
				return;
			}

			// To avoid having to do the whole Leaflet submodule dance, override core zoom functionality here to never show
			// overlays beyond the base layer's minZoom / maxZoom.  As indicated below, assume that the 1st layer is the base layer!
			// https://github.com/cgalvarino/Leaflet/blob/e8c28b996179373447dde1df479898576a508579/src/layer/Layer.js#L253
			Leaflet.extend(this._map, {_updateZoomLevels: function () {
				var minZoom = Infinity,
					maxZoom = -Infinity,
					oldZoomSpan = this._getZoomSpan();

				var baseLayer;
				for (var i in this._zoomBoundLayers) {
					// Assume that the base layer is the 1st layer.
					baseLayer = baseLayer || this._zoomBoundLayers[i];

					var options = this._zoomBoundLayers[i].options;

					minZoom = baseLayer.options.minZoom === undefined ? minZoom : Math.max(baseLayer.options.minZoom, options.minZoom);
					maxZoom = baseLayer.options.maxZoom === undefined ? maxZoom : Math.min(baseLayer.options.maxZoom, options.maxZoom);
				}

				this._layersMaxZoom = maxZoom === -Infinity ? undefined : maxZoom;
				this._layersMinZoom = minZoom === Infinity ? undefined : minZoom;

				// @section Map state change events
				// @event zoomlevelschange: Event
				// Fired when the number of zoomlevels on the map is changed due
				// to adding or removing a layer.
				if (oldZoomSpan !== this._getZoomSpan()) {
					this.fire('zoomlevelschange');
				}

				if (this.options.maxZoom === undefined && this._layersMaxZoom && this.getZoom() > this._layersMaxZoom) {
					this.setZoom(this._layersMaxZoom);
				}
				if (this.options.minZoom === undefined && this._layersMinZoom && this.getZoom() < this._layersMinZoom) {
					this.setZoom(this._layersMinZoom);
				}
			}});

			// Add standard overlays if empty permalink (which implies MassGIS basemap).
			let layers = (hs.has('bl') || hs.has('l')) ?
				[] : cs.defaultLayers;

			// Permalink format:  NAME__STYLE__STATUS__OPACITY
			// __STATUS (optional) may be __OFF or __ON.
			// __OPACITY (optional) may be an __integer from __0 to __100.

			// Incoming permalink layers override defaults.
			if (hs.has('l')) {
				layers = (hs.get('l') as string).split(',');
			}

			// Only add layers we recognize, according to permalink order.
			let toAdd: any[] = [];
			// Keep track of any layers that should start off not enabled.
			let notEnabled: any[] = [];
			// Keep track of any layers that have specified opacity.
			let opacitySet: any = {};
			layers.forEach(l => {
				const catlyr = cat.uniqueLayers.find(cl => {
					return new RegExp('^' + cl.name + "__" + cl.style + '(__ON|__OFF)*(__\\d+)*' + '$').test(l);
				});
				if (catlyr) {
					toAdd.unshift(catlyr);
					const a = /(__ON|__OFF)*(__\d+)*$/.exec(l);
					if (a) {
						if (a[1] === '__OFF') {
							notEnabled.push(catlyr.name + '__' + catlyr.style);
						}
						if (a.length > 2) {
							opacitySet[catlyr.name + '__' + catlyr.style] = String(a[2]).replace('__', '');
						}
					}
				}
			})

			for await (let v of toAdd) {
				const l = new Layer(
					v.name!,
					v.style!,
					v.title!,
					v.type!,
					v.agol || cs.geoserverUrl + '/geoserver/wms',
					v.query || v.name!,
					cs.geoserverUrl
				);
				await ls.addLayer.bind(ls)(l);
				if (notEnabled.indexOf(v.name + '__' + v.style) >= 0) {
					l.enabled = false;
				}
				l.opacity = opacitySet[v.name + '__' + v.style] !== undefined ? opacitySet[v.name + '__' + v.style] : 100;
			};

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
		MapScaleControl({position: 'bottomleft'}).addTo(this._map!);

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
		NorthArrowControl({position: 'bottomleft'}).addTo(this._map!);

		// clear all layers, if there were any to start
		runInAction(() => {
			this._leafletLayers.clear();
		});
		m.eachLayer((l) => {
			m.removeLayer(l);
		});

		m.addEventListener('moveend zoomend', () => {
			runInAction(() => {
				this._mapZoom = this._map?.getZoom() || 0;
				this._mapExtent = [
					this.leafletMap?.getBounds().getSouthWest().lng || 0,
					this.leafletMap?.getBounds().getSouthWest().lat || 0,
					this.leafletMap?.getBounds().getNorthEast().lng || 0,
					this.leafletMap?.getBounds().getNorthEast().lat || 0,
				]
			});
			document.getElementById('map-scale')!.innerHTML = '1:' + String(Math.round(this.currentScale)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		});

		m.on('baselayerchange', (e: LayersControlEvent) => {
			runInAction(() => {
				this._activeBaseLayer = this._basemaps.find((bm) => bm.name === e.name);
			});
		});

		// shove basemap opacity control into the mix
		this._layerControl = new Control.Layers();
		Leaflet.extend(this._layerControl, {_initLayout: function() {
			Control.Layers.prototype['_initLayout'].call(this);
			DomUtil.create('div', 'leaflet-control-layers-separator', this._section);
			let opacity = DomUtil.create('div', 'leaflet-control-layers-opacity', this._section);
			opacity.style.textAlign = 'center';
			opacity.innerHTML = 'Opacity <span id="basemap-opacity">(100%)</span><br/>0% <input type="range" min="1" max="100" value="100" class="slider" style="height:10px"> 100%';
			opacity.getElementsByTagName('input')[0].oninput = function() {
				const value = this['value'];
				basemaps.forEach(o => {
					o.layer.setOpacity(value / 100);
				})
				opacity.getElementsByTagName('span')[0].innerHTML = ' (' + value + '%)';
			}
		}});
		this._layerControl.addTo(this._map!);

		this._basemaps = this._basemaps.filter((bm) =>
			cs.availableBasemaps.indexOf(bm.name) >= 0
		);
		// save a pointer to the basemaps so the opacity control can get to it
		const basemaps = this._basemaps;

		runInAction(() => {
			this._activeBaseLayer = this._basemaps.find((bm) => bm.name === cs.availableBasemaps[0])
		})


		// square away the basemaps
		if (hs.has('bl') && this._basemaps.find((o) => {return hs.get('bl') === o.name})) {
			runInAction(() => {
				this._activeBaseLayer = this._basemaps.find((bm) => bm.name === hs.get('bl'));
			});
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
					runInAction(() => {
						this._leafletLayers.set(id, newLayer);
					});
				}
				else if (['wms', 'pt', 'line', 'poly'].indexOf(type) >= 0) {
					const newLayer = l.createLeafletWMSLayer();
					this._map?.addLayer(newLayer);
					runInAction(() => {
						this._leafletLayers.set(id, newLayer);
					});
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
					} else if (f.geometry.type === 'MultiPolygon') {
						let latLngs = [];
						for (let i = 0; i < f.geometry.coordinates[0].length; i++) {
							latLngs.push(f.geometry.coordinates[0][i].map((f:Array<number>) => new LatLng(f[1], f[0])));
						}
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

		runInAction(() => {
			this._ready = true;
		});
	}
}

export { MapService };
