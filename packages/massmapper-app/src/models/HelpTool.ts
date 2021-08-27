import { Tool, ToolPosition } from "./Tool";
import { ExtentHistoryToolComponent } from "../components/ExtentHistoryToolComponent";
import { ContainerInstance } from "typedi";
import { LatLngBounds } from "leaflet";
import { autorun } from "mobx";
import { MakeToolButtonComponent } from "../components/MakeToolButtonComponent";
import { HelpOutline } from "@material-ui/icons";

class HelpTool extends Tool {

	protected _isButton = true;
    private _url: string;

	constructor(
		protected readonly _services:ContainerInstance,
		public readonly id:string,
		public position: ToolPosition,
		public readonly options:any
	) {
		super(_services,id,position,options);

		this._url = options.url;
	}


	protected async _deactivate() {
	}

	protected async _activate() {
		// no-op
	}

	public component() {
		return MakeToolButtonComponent(
            HelpOutline,
            'See help documentation',
            () => {
                window.open(this._url);
            },
            undefined,
            {
                marginTop: '.5em',
                minWidth: '30px',
                maxWidth: '30px',
            });
	}
}

export { HelpTool };