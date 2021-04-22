import { DomUtil, TileLayer, Map as LeafletMap, Control } from 'leaflet';
import { autorun, computed, makeObservable, observable } from "mobx";
import { ContainerInstance, Service } from "typedi";
import { LegendService, Layer } from './LegendService';
import * as wms from '@2creek/leaflet-wms';

@Service()
class MapService {
	private static createLeafletTileLayer(uiLayer: Layer): TileLayer {
		const { id, srcURL} = uiLayer;
		const lyr = new TileLayer(
			srcURL,
			{
				id,
				pane: id
			}
		);

		lyr.addEventListener('loading', () => {
			uiLayer.isLoading = true;
		});
		lyr.addEventListener('load', () => {
			uiLayer.isLoading = false;
		});

		return lyr;
	}

	private static createLeafletWMSLayer(uiLayer: Layer) {
		const { id, srcURL, options} = uiLayer;
		let lyr = wms.overlay(
			srcURL,
			{
					pane: id,
					layers: options!.layers,
					styles: options!.styles,
					transparent: true,
					format: "image/png"
			}
		);

		// Explicitly set the id since wms.overlay doesn't do this free of charge.
		lyr.options.id = id;

		lyr.onLoadStart = function() {
			uiLayer.isLoading = true;
		}
		lyr.onLoadEnd = function() {
			uiLayer.isLoading = false;
		}

		return lyr;
	}

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

	private _leafletLayers: Map<string, TileLayer>;
	private _legendService: LegendService;
	private _map: LeafletMap | null = null;
	private _ready: boolean = false;
	private _mapZoom: number = 0;

	constructor(services: ContainerInstance) {
		makeObservable<MapService, '_map' | '_ready' | '_mapZoom'>(
			this,
			{
				_map: observable,
				_ready: observable,
				_mapZoom: observable,
				currentScale: computed,
			}
		);

		this._legendService = services.get(LegendService);
		this._leafletLayers = new Map<string, TileLayer>();

		(async () => {
			await new Promise(resolve => setTimeout(resolve, 1000)); // wait 1 second
			this._ready = true;
		})();
	}

	public async initLeafletMap(m: LeafletMap): Promise<void> {
		this._map = m;

		new Control.Scale({position: 'bottomright'}).addTo(m);

		this._leafletLayers.clear();

		// clear all layers, if there were any to start
		m.eachLayer((l) => {
			m.removeLayer(l);
		});

		m.addEventListener('moveend', () => {
			this._mapZoom = this._map?.getZoom() || 0;
		});

		// after every change to the enabledLayers, sync the layer list to the map
		autorun(() => {
			const toAdd: Layer[] = [];
			const toDelete: string[] = [];

			const els = this._legendService.enabledLayers;
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
				const { id, type } = l;
				this._map?.createPane(id);

				if (type === 'tile') {
					const newLayer = MapService.createLeafletTileLayer(l);
					this._map?.addLayer(newLayer);
					this._leafletLayers.set(id, newLayer);
				}
				else if (type === 'wms') {
					const newLayer = MapService.createLeafletWMSLayer(l);
					this._map?.addLayer(newLayer);
					this._leafletLayers.set(id, newLayer);
				}
			});

			els.forEach((l, index) => {
				const pane = this._map?.getPane(l.id);

				if (pane) {
					// .leaflet-tile-pane starts at zIndex of 200.
					pane.style.zIndex = `${index + 200}`;
				} else {
					console.error(`No pane for layer with id '${l.id}'.`);
				}
			});

			// Line up ancillary scale info.
			this._map?.fireEvent('moveend');
		});
	}
}

export { MapService };
