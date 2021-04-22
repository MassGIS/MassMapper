import { DomUtil, TileLayer, Map as LeafletMap, Control } from 'leaflet';
import { autorun, makeObservable, observable } from "mobx";
import { ContainerInstance, Service } from "typedi";
import { LegendService, Layer } from './LegendService';
import * as wms from '@2creek/leaflet-wms';

@Service()
class MapService {
	private static createLeafletTileLayer(id: string, srcURL: string): TileLayer {
		return new TileLayer(
			srcURL,
			{
				id,
				pane: id
			}
		);
	}

	private static createLeafletWMSLayer(id: string, srcURL: string, layers: string, styles: string) {
		let ret = wms.overlay(
			srcURL,
			{
					pane: id,
					layers: layers,
					styles: styles,
					transparent: true,
					format: "image/png"
			}
		);
		// For now, explicitly set the id (hopefully this will eventually be taken care of inside wms.overlay).
		ret.options.id = id;
		return ret;
	}

	private getMapScale(): number {
		// https://docs.microsoft.com/en-us/bingmaps/articles/bing-maps-tile-system
		const EARTH_RADIUS = 6378137;
		const SCREEN_PPI = 96;
		if (this._map) {
			return (Math.cos(this._map.getCenter().lat * Math.PI/180) * 2 * Math.PI * EARTH_RADIUS * SCREEN_PPI) / 
				(256 * Math.pow(2, this._map.getZoom()) * 0.0254);
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

	constructor(services: ContainerInstance) {
		makeObservable<MapService, '_map' | '_ready'>(
			this,
			{
				_map: observable,
				_ready: observable
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
			// Determine if a layer should be visible for the map's current (calcualted) scale.
			const scale = this.getMapScale();
			const els = this._legendService.enabledLayers;
			els.forEach((l) => {
				if (l.minScale !== undefined && l.maxScale !== undefined) {
					l.scaleOK = l.minScale <= scale && scale <= l.maxScale;
				}
			});
		})

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

			toAdd.forEach(({ id, srcURL, type, options}) => {
				this._map?.createPane(id);

				if (type === 'tile') {
					const newLayer = MapService.createLeafletTileLayer(id, srcURL);
					this._map?.addLayer(newLayer);
					this._leafletLayers.set(id, newLayer);
				}
				else if (type === 'wms') {
					const newLayer = MapService.createLeafletWMSLayer(id, srcURL, options!.layers, options!.styles);
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
