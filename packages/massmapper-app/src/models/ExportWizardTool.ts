import { Tool, ToolPosition } from "./Tool";
import { ContainerInstance } from "typedi";
import ExportWizardComponent from "../components/ExportWizardComponent";


class ExportWizardTool extends Tool {

	protected _isButton = true;

	constructor(
		protected readonly _services:ContainerInstance,
		public readonly id:string,
		public position: ToolPosition,
		public readonly options:any
	) {
		super(_services,id,position,options);

		// makeObservable<ExportWizardTool,>(
		// 	this,
		// );

	}

	protected async _deactivate() {
		// no-op
	}

	protected async _activate() {
		// no-op
	}

	public component() {
		return ExportWizardComponent;
	}
}


export { ExportWizardTool };