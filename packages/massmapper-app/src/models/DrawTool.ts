import { FeatureGroup, Draw, DivIcon, Point, Marker, LatLng, Icon } from 'leaflet';
import draw from 'leaflet-draw';
const d = draw;
import { autorun, IReactionDisposer, makeObservable, observable } from "mobx";
import { MapService } from "../services/MapService";
import { Tool, ToolPosition } from "./Tool";

import { DrawToolComponent } from '../components/DrawToolComponent';
import { ContainerInstance } from 'typedi';

import './DrawTool.module.css';
class DrawTool extends Tool {
	public drawMode: 'text' | 'line' = 'line';
	public showTextEntryDialog:boolean = false;
	public showPalette:boolean = false;

	private _textClickedLocation?: LatLng;
	private _drawDisposer:IReactionDisposer;
	private _drawnItems:FeatureGroup = new FeatureGroup();
	private _markers:Marker[] = [];
	public lineColor: string = 'blue';
	private _drawLineHandler: Draw.Polyline | Draw.Polygon;

	private _handleTextCompleteHandler;
	private _handlePointClickedHandler;

	private _handleDrawComplete(evt: any) {
		if (!this._drawnItems['_map']) {
			const ms = this._services.get(MapService);
			ms.leafletMap?.addLayer(this._drawnItems);
		}
		this._drawnItems.addLayer(evt.layer);
		this.showPalette = true;
	}

	public clearExistingShape() {
		this._drawnItems && this._drawnItems.clearLayers();
		this._markers.forEach((m) => {
			const ms = this._services.get(MapService);
			ms.leafletMap && m.removeFrom(ms.leafletMap);
		});
		this._markers.splice(0,this._markers.length);
	}

	public setLineColor(hex: string) {
		this.lineColor = hex;
		this._drawLineHandler && this._drawLineHandler.setOptions({
			shapeOptions: {
				color: hex
			}
		})

		// if you clicked color, force shift to line
		this.drawMode = 'line';
		this._drawLineHandler.disable();
		this._drawLineHandler.enable();
		// if (this.drawMode !== 'line') {
		// 	this._drawLineHandler.enable();
		// }
	}

	public _handleTextClickLocation(evt: any) {
		this._textClickedLocation = evt.latlng;
		this.showTextEntryDialog = true;
	}

	public addText(text: string) {
		const ms = this._services.get(MapService);

		const marker = new Marker(this._textClickedLocation!, {
			opacity: 1.0,
			icon: new Icon({
				iconUrl: 'test.png'
			})
		}); //opacity may be set to zero
		marker.bindTooltip(
			text,
			{
				permanent: true,
				className: "massmapper-draw-text",
				offset: [0, 0],
				direction: 'center'
			});
		ms.leafletMap && marker.addTo(ms.leafletMap);
		this._markers.push(marker);

		this._textClickedLocation = undefined;
		this.showTextEntryDialog = false;
	}

	constructor(
		protected readonly _services:ContainerInstance,
		public readonly id:string,
		public position: ToolPosition,
		public readonly options: any
	) {
		super(_services,id,position,options);
		this._drawnItems ;
		this._handleTextCompleteHandler = this._handleTextClickLocation.bind(this);
		this._handlePointClickedHandler = this._handlePointClicked.bind(this)

		makeObservable<DrawTool>(
			this,
			{
				drawMode: observable,
				showTextEntryDialog: observable,
				showPalette: observable,
			}
		);
	}

	private _handlePointClicked() {
		this.showPalette = false;
	}

	protected async _deactivate() {
		const ms = this._services.get(MapService);

		this._drawDisposer && this._drawDisposer();
		this._drawLineHandler && this._drawLineHandler.disable();
		ms.leafletMap?.off(Draw.Event.CREATED, this._handleDrawComplete.bind(this));

		ms.leafletMap?.off('click', this._handleTextCompleteHandler);
	}

	protected async _activate() {
		const ms = this._services.get(MapService);
		this.showPalette = true;

		this._drawDisposer = autorun(() => {
			if (!ms.leafletMap) {
				return;
			}

			this._cursor = "";

			if (!ms.leafletMap['drawLine']) {
				ms.leafletMap.addHandler('drawLine', (window.L as any).Draw.Polyline);
				this._drawLineHandler = ms.leafletMap['drawLine'];
				this._drawLineHandler.setOptions({
					showArea: false,
					showLength: false,
					repeatMode: true,
					icon: new DivIcon({
						iconSize: new Point(10, 10),
						className: 'leaflet-div-icon leaflet-editing-icon'
					}),
					shapeOptions: {
						color: this.lineColor
					}
				})
			}

			// disable both handlers
			this._drawLineHandler?.disable();
			ms.leafletMap.off('click', this._handleTextCompleteHandler);
			ms.leafletMap.off(Draw.Event.DRAWVERTEX, this._handlePointClickedHandler);

			// enable the right handler
			if (this.drawMode === 'line') {
				ms.leafletMap.on(Draw.Event.CREATED, this._handleDrawComplete.bind(this));
				ms.leafletMap.on(Draw.Event.DRAWVERTEX, this._handlePointClickedHandler);
				this._drawLineHandler.enable();
			} else {
				ms.leafletMap.on('click', this._handleTextCompleteHandler)
				this._cursor = "crosshair";
			}
		});
	}

	public component() {
		return DrawToolComponent;
	}
}

export { DrawTool };