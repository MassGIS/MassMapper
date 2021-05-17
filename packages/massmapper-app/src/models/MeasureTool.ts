import { FeatureGroup, Draw } from 'leaflet';
import draw from 'leaflet-draw';
const d = draw;
import { autorun, IReactionDisposer, makeObservable, observable } from "mobx";
import { MapService } from "../services/MapService";
import { Tool, ToolPosition } from "./Tool";
import ruler from '../images/ruler.png';

import './MeasureTool.module.css';
import { ContainerInstance } from 'typedi';
import { MakeToolButtonComponent } from '../components/MakeToolButtonComponent';

class MeasureTool extends Tool {

	private _measureDisposer:IReactionDisposer;
	private _drawnItems:FeatureGroup;
	private _handler: Draw.Polyline;
	private _totalLength: string;
	private _labelPosition: {x:number, y:number};

	get totalLength():string {
		return this._totalLength;
	}
	// get labelPosition(): {x: number, y: number} {
	// 	return this._labelPosition;
	// }

	private _handleMeasureComplete(evt: any) {
		this._drawnItems.addLayer(evt.layer);
		const lengthInFeet = parseFloat((this._handler as any)._getMeasurementString());
		this._totalLength = lengthInFeet > 6000 ? (lengthInFeet/5280).toFixed(2) + ' mi' : lengthInFeet.toFixed(2) + ' ft';

		// const x = (evt.layer._pxBounds.max.x - evt.layer._pxBounds.min.x)/2 + evt.layer._pxBounds.min.x;
		// const y = (evt.layer._pxBounds.max.y - evt.layer._pxBounds.min.y)/2 + evt.layer._pxBounds.min.y;
		// this._labelPosition = {
		// 	x,
		// 	y,
		// }
	}

	private _clearExistingShape() {
		this._drawnItems && this._drawnItems.clearLayers();
		this._totalLength = '';
		// this._labelPosition = { x: -1, y: -1};
	}

	constructor(
		protected readonly _services:ContainerInstance,
		public readonly id:string,
		public position: ToolPosition
	) {
		super(_services,id,position);


		this._totalLength = '';
		this._labelPosition = {x:-1, y:-1};

		makeObservable<MeasureTool, '_totalLength' | '_labelPosition'>(
			this,
			{
				_totalLength: observable,
				_labelPosition: observable,
			}
		);
	}

	protected async _deactivate() {
		this._measureDisposer && this._measureDisposer();
		this._handler && this._handler.disable();
		this._clearExistingShape();

		const ms = this._services.get(MapService);
		ms.leafletMap?.off(Draw.Event.DRAWVERTEX, this._clearExistingShape.bind(this));
		ms.leafletMap?.off(Draw.Event.CREATED, this._handleMeasureComplete.bind(this));
	}

	protected async _activate() {
		const ms = this._services.get(MapService);
		this._measureDisposer = autorun(() => {
			if (!ms.leafletMap) {
				return;
			}

			ms.leafletMap.on(Draw.Event.DRAWVERTEX, this._clearExistingShape.bind(this));

			if (!ms.leafletMap['measure'])
				ms.leafletMap.addHandler('measure', (window.L as any).Draw.Polyline);

			this._drawnItems = new FeatureGroup();
     		ms.leafletMap.addLayer(this._drawnItems);

			this._handler = ms.leafletMap['measure'];
			this._handler.setOptions({
				showLength: true,
				metric: false,
				feet: true,
				repeatMode: true,
			})
			ms.leafletMap.on(Draw.Event.CREATED, this._handleMeasureComplete.bind(this));
			this._handler.enable();
		});
	}

	public component() {
		// return MeasureToolComponent;
		return MakeToolButtonComponent(ruler, 'Click to measure distances');
	}
}

export { MeasureTool };