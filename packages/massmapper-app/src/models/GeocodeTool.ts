import { autorun, IReactionDisposer, makeObservable, observable } from "mobx";
import { MapService } from "../services/MapService";
import { Tool, ToolPosition } from "./Tool";

// import './MeasureTool.module.css';
import { ContainerInstance } from 'typedi';
import { FunctionComponent } from "react";
import { GeocodeToolComponent } from '../components/GeocodeToolComponent';
// import { MakeToolButtonComponent } from '../components/MakeToolButtonComponent';

class GeocodeTool extends Tool {

	constructor(
		protected readonly _services:ContainerInstance,
		public readonly id:string,
		public position: ToolPosition,
		public readonly options:any
	) {
		super(_services,id,position,options);

		// makeObservable<GeocodeTool>(
		// 	this,
		// 	{
		// 	}
		// );
	}

	protected async _deactivate() {
		// no-op, never de-activates
	}

	protected async _activate() {
		// no-op, never activates
	}

	public component() {
		return GeocodeToolComponent
	}
}

export { GeocodeTool };