import {
	DomUtil,
	DomEvent,
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
import { SimpleMapScreenshoter } from 'leaflet-simple-map-screenshoter';
import massmapper from '../images/massmapper.png';
import north from '../images/north_arrow.png';
import { jsPDF } from 'jspdf';
import { doc } from 'prettier';

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
				'https://tiles.arcgis.com/tiles/hGdibHYSPO59RG1h/arcgis/rest/services/MassGIS_Topographic_Features_for_Basemap/MapServer/tile/{z}/{y}/{x}'
			)
		},
		{
			name: '2019 Color Orthos (USGS)',
			layer: new TileLayer(
				'https://tiles.arcgis.com/tiles/hGdibHYSPO59RG1h/arcgis/rest/services/USGS_Orthos_2019/MapServer/tile/{z}/{y}/{x}'
			)
		},
		{
			name: 'USGS Topographic Quadrangle Maps',
			layer: new TileLayer(
				'https://tiles.arcgis.com/tiles/hGdibHYSPO59RG1h/arcgis/rest/services/USGS_Topo_Quad_Maps/MapServer/tile/{z}/{y}/{x}'
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
		const ls = this._services.get(LegendService);

		// need to load layers
		autorun((r) => {
			const cs = this._services.get(CatalogService);
			if (!cs.ready || !ls.ready) {
				return;
			}

			// Add standard overlays if empty permalink (which implies MassGIS basemap).
			let layers = (hs.has('bl') || hs.has('l')) ? 
				[] : 
				'Basemaps_Structures__,Basemaps_L3Parcels__,Basemaps_MassGISBasemapWithLabels2__'.split(',');

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

		// Add PDF button.
		const ss = new SimpleMapScreenshoter({
			hideElementsWithSelectors: [
				'.leaflet-top.leaflet-left',
				'.leaflet-top.leaflet-right'
			],
			preventDownload: true
		}).addTo(this._map);
		this._map.on('simpleMapScreenshoter.click', function() {
			// TODO:  prompt for title and filename, and perhaps block out any interaction w/ a Waiting dialog.
			makePDF('MY MAP', 'map.pdf');
		});

		const WM = Control.extend({
			onAdd: function () {
				const img = document.createElement('img');
				img.src = massmapper;
				img.onclick = function(e) { 
					DomEvent.stopPropagation(e);
				}
				return img;
			},
			onRemove: function () {
			},
		});
		const WatermarkControl = function(opts: Leaflet.ControlOptions | undefined) {
			return new WM(opts);
		};
		WatermarkControl({position: 'bottomright'}).addTo(this._map);

		new Control.Scale({position: 'bottomleft'}).addTo(m);
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

		const makePDF = (title: string, filename: string) => {
			const legendWidth = 200;
			const titleHeight = 50;
			const leftMargin = 20;

			ss.takeScreen('image', {}).then(image => {
				const pdf = new jsPDF('l', 'pt', [m.getSize().x - 0, m.getSize().y]);

				pdf.text(title, pdf.internal.pageSize.getWidth() / 2, 30, {align: 'center'});

				const mapWidth = pdf.internal.pageSize.getWidth() - legendWidth - leftMargin;
				const ratio = mapWidth / pdf.internal.pageSize.getWidth();
				const mapHeight = (pdf.internal.pageSize.getHeight() - titleHeight) * ratio;
				pdf.addImage(String(image), 'PNG', leftMargin, titleHeight, mapWidth, mapHeight);

				let legends: any[] = [];
				const layers = ls.enabledLayers.map(async (l, i) => {
					if (l.legendURL) {
						const legImg = new Image();
						legImg.src = l.legendURL;
						legImg.crossOrigin = 'Anonymous';
						await legImg.decode();

						const canvas = document.createElement('canvas');
						canvas.width = legImg.width;
						canvas.height = legImg.height;
						const context = canvas.getContext('2d');
						context?.drawImage(legImg, 0, 0);

						legends[i] = {
							title: l.title,
							img: {
								data: canvas.toDataURL('image/gif'),
								width: legImg.width,
								height: legImg.height
							}
						};
					}
					else {
						legends[i] = {
							title: l.title,
							img: null
						}
						return Promise.resolve();
					}
				});

				Promise.all(layers).then(() => {
					let y = titleHeight + 20;

					legends.forEach(leg => {
						// Word wrap (trying near character(s) 20); H/T https://stackoverflow.com/a/51506718
						const title = leg.title.replace(
							/(?![^\n]{1,20}$)([^\n]{1,20})\s/g, '$1\n'
						);
						// Write it.
						pdf.text(title, leftMargin + mapWidth + 10, y);
						// Number of newlines
						const c = (title.match(/\n/g) || []).length;
						y += c * 20;
						if (leg.img) {
							y += 5;
							pdf.addImage(String(leg.img.data), 'PNG', leftMargin + mapWidth + 10, y, leg.img.width, leg.img.height);
							y += leg.img.height;
						}
						y += 25;
					})

					pdf.save(filename);
				});
			})
		}

		this._ready = true;
	}
}

export { MapService };
