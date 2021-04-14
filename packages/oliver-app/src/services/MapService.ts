import { DomUtil, TileLayer, Map as LeafletMap } from 'leaflet';
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
		const ret = wms.overlay(
			srcURL,
			{
					id,
					pane: id,
					layers: layers,
					styles: styles,
					transparent: true,
					format: "image/png"
			}
		);
		debugger;
		return ret;
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

		this._leafletLayers.clear();

		// clear all layers, if there were any to start
		m.eachLayer((l) => {
			m.removeLayer(l);
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

			console.log("deleting", toDelete);
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

			console.log("adding", toAdd);
			toAdd.forEach(({ id, srcURL, type, options }) => {
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
		});
	}
}

export { MapService };
