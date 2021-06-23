import { FeatureGroup, Draw, GeometryUtil, DivIcon, divIcon, Point } from 'leaflet';
import draw from 'leaflet-draw';
const d = draw;
import { autorun, IReactionDisposer, makeObservable, observable } from "mobx";
import { MapService } from "../services/MapService";
import { Tool, ToolPosition } from "./Tool";

import { MeasureToolComponent } from '../components/MeasureToolComponent';
import { ContainerInstance } from 'typedi';

import './MeasureTool.module.css';

class MeasureTool extends Tool {

	private _measureDisposer:IReactionDisposer;
	private _drawnItems:FeatureGroup;
	private _measureHandler: Draw.Polyline | Draw.Polygon;
	private _totalLength?: number;
	private _totalArea?: number;
	public measureMode: 'Length' | 'Area' = 'Length';
	public lengthUnits : 'ft' | 'm' | 'mi' = 'ft';
	public areaUnits : 'sq ft' | 'acres' | 'sq meters' | 'sq mi' = 'acres';

	get totalLength():string {
		if (this._totalLength === undefined) {
			return '';
		} else if (this.lengthUnits === 'ft') {
			return this._totalLength.toFixed(1) + ' ft';
		} else if (this.lengthUnits === 'm') {
			return (this._totalLength * 0.3048).toFixed(1) + " m";
		} else if (this.lengthUnits === 'mi') {
			return (this._totalLength / 5280).toFixed(2) + " mi";
		}
		return '';
	}
	get totalArea():string {
		if (this._totalArea === undefined) {
			return '';
		}

		if (this.areaUnits === 'sq ft') {
			return (this._totalArea * 10.7639).toFixed(1) + ' sq ft';
		} else if (this.areaUnits === 'acres') {
			return (this._totalArea * 0.000247105).toFixed(2) + ' acres';
		} else if (this.areaUnits === 'sq meters') {
			return this._totalArea.toFixed(1) + ' sq meters';
		} else if (this.areaUnits === 'sq mi') {
			return (this._totalArea * 3.86101562499999206e-7).toFixed(3) + ' sq mi';
		}
		return '';
	}

	private _handleMeasureComplete(evt: any) {
		this._drawnItems.addLayer(evt.layer);
		if (this.measureMode === 'Length') {
			this._totalLength = parseFloat((this._measureHandler as any)._getMeasurementString());
			this._totalArea = undefined;
		} else {
			const areaInSqMeters = GeometryUtil.geodesicArea(this._measureHandler['_poly'].getLatLngs());
			this._totalArea = areaInSqMeters;
			this._totalLength = undefined;
		}
	}

	private _clearExistingShape() {
		this._drawnItems && this._drawnItems.clearLayers();
		this._totalLength = undefined;
		this._totalArea = undefined;
	}

	private _updateMeasureUI(evt: any) {
		const handler = this._measureHandler;
		if (handler && this._active) {
			if (this.measureMode === 'Length') {
				const total = parseFloat(handler['_getMeasurementString']());
				if (total) {
					this._totalLength = total;
				}
			} else {
				const area = GeometryUtil.geodesicArea(handler['_poly'].getLatLngs())
				if (area) {
					this._totalArea = GeometryUtil.geodesicArea(handler['_poly'].getLatLngs());
				}
			}

			console.log(handler);
		}
	}

	constructor(
		protected readonly _services:ContainerInstance,
		public readonly id:string,
		public position: ToolPosition,
		public readonly options: any
	) {
		super(_services,id,position,options);

		this._totalLength = undefined;
		this._totalArea = undefined;

		makeObservable<MeasureTool, '_totalLength' | '_totalArea' >(
			this,
			{
				_totalLength: observable,
				_totalArea: observable,
				measureMode: observable,
				lengthUnits: observable,
				areaUnits: observable,
			}
		);
	}

	protected async _deactivate() {
		this._measureDisposer && this._measureDisposer();
		this._measureHandler && this._measureHandler.disable();
		this._clearExistingShape();

		const ms = this._services.get(MapService);
		ms.leafletMap?.off(Draw.Event.DRAWVERTEX, this._clearExistingShape.bind(this));
		ms.leafletMap?.off(Draw.Event.DRAWVERTEX, this._updateMeasureUI.bind(this));
		ms.leafletMap?.off(Draw.Event.CREATED, this._handleMeasureComplete.bind(this));
		ms.leafletMap?.off('mousemove', this._updateMeasureUI.bind(this));
	}

	protected async _activate() {
		const ms = this._services.get(MapService);
		this._drawnItems = new FeatureGroup();
		ms.leafletMap?.addLayer(this._drawnItems);

		this._measureDisposer = autorun(() => {
			if (!ms.leafletMap) {
				return;
			}

			ms.leafletMap.on(Draw.Event.DRAWVERTEX, this._clearExistingShape.bind(this));
			ms.leafletMap.on(Draw.Event.DRAWVERTEX, this._updateMeasureUI.bind(this));

			if (!ms.leafletMap['measureLine'])
				ms.leafletMap.addHandler('measureLine', (window.L as any).Draw.Polyline);
			if (!ms.leafletMap['measureArea'])
				ms.leafletMap.addHandler('measureArea', (window.L as any).Draw.Polygon);

			this._measureHandler?.disable();
			this._clearExistingShape();

			if (this.measureMode === 'Length') {
				this._measureHandler = ms.leafletMap['measureLine'];
				this._measureHandler.setOptions({
					showLength: false,
					metric: false,
					feet: true,
					repeatMode: true,
					icon: new DivIcon({
						iconSize: new Point(10, 10),
						className: 'leaflet-div-icon leaflet-editing-icon'
					}),
				})
			} else {
				this._measureHandler = ms.leafletMap['measureArea'];
				this._measureHandler.setOptions({
					showArea: true,
					showLength: false,
					metric: false,
					feet: true,
					repeatMode: true,
				})
			}

			ms.leafletMap.on('mousemove', this._updateMeasureUI.bind(this));

			ms.leafletMap.on(Draw.Event.CREATED, this._handleMeasureComplete.bind(this));
			this._measureHandler.enable();
		});
	}

	public component() {
		return MeasureToolComponent;
	}
}

export { MeasureTool };