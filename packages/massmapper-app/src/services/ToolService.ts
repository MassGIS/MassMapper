import { autorun, computed, makeObservable, observable } from "mobx";
import { ContainerInstance, Service } from "typedi";
import { Tool, ToolPosition } from '../models/Tool';
import { IdentifyToolWithPoint } from "../models/IdentifyToolWithPoint";
import { MeasureTool } from "../models/MeasureTool";
import { IdentifyToolWithBox } from "../models/IdentifyToolWithBox";
import { PermalinkTool } from "../models/PermalinkTool";
import { LogoTool } from "../models/LogoTool";
import massmapper from '../images/massmapper.png';
import { GoogleGeocodeTool } from "../models/GoogleGeocodeTool";
import { ArcGISGeocodeTool } from "../models/ArcGISGeocodeTool";
import { ShowCoordinatesTool } from "../models/ShowCoordinatesTool";
import { MapService } from "./MapService";
import { AbuttersTool } from "../models/AbuttersTool";
import { PrintPdfTool } from "../models/PrintPdfTool";

type ToolServiceAnnotations = '_tools' | '_ready';
interface ToolDefinition {
	id: string;
	position: ToolPosition;
	class: typeof Tool;
	isDefault?: boolean;
	options?: any;
}

const delay = (duration:number) => new Promise(resolve => setTimeout(resolve, duration));
@Service()
class ToolService {

	get tools(): Tool[] {
		return Array.from(this._tools.values());
	}

	get activeTool(): Tool | undefined{
		return Array.from(this._tools.values()).filter((t:Tool) => t.isActive)[0];
	}

	get ready(): boolean {
		return this._ready;
	}

	private readonly _tools: Map<string,Tool>;
	private _ready: boolean = false;

	constructor(private readonly _services: ContainerInstance) {
		this._tools = new Map<string,Tool>();

		makeObservable<ToolService, ToolServiceAnnotations>(
			this,
			{
				_tools: observable,
				_ready: observable,
				activeTool: computed,
			}
		);

		autorun(() => {
			const ms = this._services.get(MapService);
			if (!ms || !ms.leafletMap) {
				return;
			}

			ms.leafletMap['_container'].style.cursor = this.activeTool?.cursor;
		},{
			delay: 10,
		});

		(async () => {
			await delay(0); // have to wait for the constructor to finish initing, and get added to the service to get registered
			const tools:Array<ToolDefinition> = [
				{
					id: 'identify-tool-point',
					position: ToolPosition.topleft,
					class: IdentifyToolWithPoint,
					isDefault: true
				},
				{
					id: 'identify-tool-box',
					position: ToolPosition.topleft,
					class: IdentifyToolWithBox,
				},
				{
					id: 'measure-tool',
					position: ToolPosition.topleft,
					class: MeasureTool,
				},
				{
					id: 'permalink-tool',
					position: ToolPosition.topleft,
					class:PermalinkTool,
				},
				{
					id: 'google-geocode-tool',
					position: ToolPosition.topright,
					class: GoogleGeocodeTool
				},
				{
					id: 'oliver-logo-tool',
					position: ToolPosition.bottomright,
					class: LogoTool,
					options: {
						logoUrl: massmapper,
						logoTooltip: 'MassMapper - by MassGIS',
						logoLink: "https://www.mass.gov/orgs/massgis-bureau-of-geographic-information"
					}
				},
				{
					id: 'arcgis-geocode-tool',
					position: ToolPosition.topleft,
					class: ArcGISGeocodeTool
				},
				{
					id: 'show-coordinates-tool',
					position: ToolPosition.bottomright,
					class: ShowCoordinatesTool
				},
				{
					id: 'abutters-tool',
					position: ToolPosition.topleft,
					class: AbuttersTool,
					options: {
						abuttersLayer: 'Basemaps_L3Parcels'
					}
				},
				{
					id: 'print-pdf-tool',
					position: ToolPosition.topleft,
					class: PrintPdfTool
				},
			];
			tools.forEach((toolDef) => {
				this.addToolFromDefinition(toolDef);
			});
			this._ready = true;
		})();
	}

	public addToolFromDefinition(def:ToolDefinition) {
		const t = new (def.class as any)(this._services, def.id, def.position, def.options, def.isDefault) as Tool;
		this.addTool(t);
		if (t.isDefault) {
			t.activate();
		}
	}

	public getTools(p:ToolPosition): Array<Tool> {
		return Array.from(this._tools.values())
			.filter((t) => t.position === p);
	}

	public async addTool(t: Tool): Promise<void> {
		if (this._tools.has(t.id)) {
			// already added
			return;
		}

		this._tools.set(t.id, t);
	}

	public removeTool(t: Tool): boolean {
		return this._tools.delete(t.id);
	}
}

export { ToolService, ToolDefinition };