import { FeatureGroup, Draw, GeometryUtil } from 'leaflet';
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
	private _totalLength: string;
	private _totalArea: string;
	public measureMode: 'Length' | 'Area' = 'Length';

	get totalLength():string {
		return this._totalLength;
	}
	get totalArea():string {
		return this._totalArea;
	}

	private _handleMeasureComplete(evt: any) {
		this._drawnItems.addLayer(evt.layer);
		if (this.measureMode === 'Length') {
			const lengthInFeet = parseFloat((this._measureHandler as any)._getMeasurementString());
			this._totalLength = lengthInFeet > 6000 ? (lengthInFeet/5280).toFixed(2) + ' mi' : lengthInFeet.toFixed(2) + ' ft';
			this._totalArea = '';
		} else {
			const areaInSqMeters = GeometryUtil.geodesicArea(this._measureHandler['_poly'].getLatLngs());
			// this._totalArea = areaInSqFt > 6000 ? (areaInSqFt/5280).toFixed(2) + ' acres' : areaInSqFt.toFixed(2) + ' sqft';
			const areaInSqFt = areaInSqMeters * 10.7639
			const areaInAcres = areaInSqMeters * 0.000247105;
			const areaInSqMi = areaInSqMeters * 3.86101562499999206e-7;
			if (areaInSqFt < 20000) {
				this._totalArea = areaInSqFt.toFixed(0) + " sqft";
			} else if (areaInAcres < 1000) {
				this._totalArea = areaInAcres.toFixed(2) + " acres";
			} else {
				this._totalArea = areaInSqMi.toFixed(3) + " sqmi";
			}
			this._totalLength = '';
		}
	}

	private _clearExistingShape() {
		this._drawnItems && this._drawnItems.clearLayers();
		this._totalLength = '';
		this._totalArea = '';
	}

	constructor(
		protected readonly _services:ContainerInstance,
		public readonly id:string,
		public position: ToolPosition,
		public readonly options: any
	) {
		super(_services,id,position,options);

		this._totalLength = '';
		this._totalArea = '';

		makeObservable<MeasureTool, '_totalLength' | '_totalArea' >(
			this,
			{
				_totalLength: observable,
				_totalArea: observable,
				measureMode: observable,
			}
		);
	}

	protected async _deactivate() {
		this._measureDisposer && this._measureDisposer();
		this._measureHandler && this._measureHandler.disable();
		this._clearExistingShape();

		const ms = this._services.get(MapService);
		ms.leafletMap?.off(Draw.Event.DRAWVERTEX, this._clearExistingShape.bind(this));
		ms.leafletMap?.off(Draw.Event.CREATED, this._handleMeasureComplete.bind(this));
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

			if (!ms.leafletMap['measureLine'])
				ms.leafletMap.addHandler('measureLine', (window.L as any).Draw.Polyline);
			if (!ms.leafletMap['measureArea'])
				ms.leafletMap.addHandler('measureArea', (window.L as any).Draw.Polygon);

			this._measureHandler?.disable();
			this._clearExistingShape();

			if (this.measureMode === 'Length') {
				this._measureHandler = ms.leafletMap['measureLine'];
				this._measureHandler.setOptions({
					showLength: true,
					metric: false,
					feet: true,
					repeatMode: true,
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

			ms.leafletMap.on(Draw.Event.CREATED, this._handleMeasureComplete.bind(this));
			this._measureHandler.enable();
		});
	}

	public component() {
		return MeasureToolComponent;
	}
}

export { MeasureTool };