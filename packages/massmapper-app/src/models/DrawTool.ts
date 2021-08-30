import { FeatureGroup, Draw, GeometryUtil, DivIcon, Point } from 'leaflet';
import draw from 'leaflet-draw';
const d = draw;
import { autorun, IReactionDisposer, makeObservable, observable } from "mobx";
import { MapService } from "../services/MapService";
import { Tool, ToolPosition } from "./Tool";

import { DrawToolComponent } from '../components/DrawToolComponent';
import { ContainerInstance } from 'typedi';

// import './MeasureTool.module.css';

class DrawTool extends Tool {

	private _drawDisposer:IReactionDisposer;
	private _drawnItems:FeatureGroup;
	private _drawHandler: Draw.Polyline | Draw.Polygon;
	public lineColor: string = 'blue';

	private _handleDrawComplete(evt: any) {
		if (!this._drawnItems['_map']) {
			const ms = this._services.get(MapService);
			ms.leafletMap?.addLayer(this._drawnItems);
		}
		this._drawnItems.addLayer(evt.layer);
	}

	public clearExistingShape() {
		this._drawnItems && this._drawnItems.clearLayers();
	}

	public setLineColor(hex: string) {
		this.lineColor = hex;
		this._drawHandler && this._drawHandler.setOptions({
			shapeOptions: {
				color: hex
			}
		})
		this._drawHandler.disable();
		this._drawHandler.enable();
	}

	constructor(
		protected readonly _services:ContainerInstance,
		public readonly id:string,
		public position: ToolPosition,
		public readonly options: any
	) {
		super(_services,id,position,options);
		this._drawnItems = new FeatureGroup();

		// makeObservable<DrawTool>(
		// 	this,
		// 	{
		// 	}
		// );
	}

	protected async _deactivate() {
		this._drawDisposer && this._drawDisposer();
		this._drawHandler && this._drawHandler.disable();
		// this.clearExistingShape();

		const ms = this._services.get(MapService);
		// ms.leafletMap?.off(Draw.Event.DRAWVERTEX, this.clearExistingShape.bind(this));
		ms.leafletMap?.off(Draw.Event.CREATED, this._handleDrawComplete.bind(this));
	}

	protected async _activate() {
		const ms = this._services.get(MapService);
		// this._drawnItems = new FeatureGroup();
		// ms.leafletMap?.addLayer(this._drawnItems);

		this._drawDisposer = autorun(() => {
			if (!ms.leafletMap) {
				return;
			}

			// ms.leafletMap.on(Draw.Event.DRAWVERTEX, this.clearExistingShape.bind(this));

			if (!ms.leafletMap['drawLine'])
				ms.leafletMap.addHandler('drawLine', (window.L as any).Draw.Polyline);
			// if (!ms.leafletMap['measureArea'])
			// 	ms.leafletMap.addHandler('measureArea', (window.L as any).Draw.Polygon);

			this._drawHandler?.disable();
			// this.clearExistingShape();

			// if (this.measureMode === 'Length') {
				this._drawHandler = ms.leafletMap['drawLine'];
				this._drawHandler.setOptions({
					repeatMode: true,
					icon: new DivIcon({
						iconSize: new Point(10, 10),
						className: 'leaflet-div-icon leaflet-editing-icon'
					}),
					shapeOptions: {
						color: this.lineColor
					}
				})
			// } else {
			// 	this._drawHandler = ms.leafletMap['measureArea'];
			// 	this._drawHandler.setOptions({
			// 		showArea: true,
			// 		showLength: false,
			// 		metric: false,
			// 		feet: true,
			// 		repeatMode: true,
			// 	})
			// }

			ms.leafletMap.on(Draw.Event.CREATED, this._handleDrawComplete.bind(this));
			this._drawHandler.enable();
		});
	}

	public component() {
		return DrawToolComponent;
	}
}

export { DrawTool };