import { makeObservable, observable } from "mobx";
import { ContainerInstance, Service } from "typedi";
import { Tool, ToolPosition } from '../models/Tool';
import { IdentifyToolWithPoint } from "../models/IdentifyToolWithPoint";
import { MeasureTool } from "../models/MeasureTool";
import { IdentifyToolWithBox } from "../models/IdentifyToolWithBox";
import { PermalinkTool } from "../models/PermalinkTool";
import { GoogleGeocodeTool } from "../models/GoogleGeocodeTool";
import { ArcGISGeocodeTool } from "../models/ArcGISGeocodeTool";

type ToolServiceAnnotations = '_tools' | '_ready';
interface ToolDefinition {
	id: string;
	position: ToolPosition;
	class: typeof Tool;
	isDefault?: boolean;
}

const delay = (duration:number) => new Promise(resolve => setTimeout(resolve, duration));
@Service()
class ToolService {

	get tools(): Tool[] {
		return Array.from(this._tools.values());
	}

	get activeTool(): Tool | undefined{
		return this._tools.get(this._activeToolId);
	}

	get ready(): boolean {
		return this._ready;
	}

	private readonly _tools: Map<string,Tool>;
	private _ready: boolean = false;
	private _activeToolId:string;

	constructor(private readonly _services: ContainerInstance) {
		this._tools = new Map<string,Tool>();

		makeObservable<ToolService, ToolServiceAnnotations>(
			this,
			{
				_tools: observable,
				_ready: observable
			}
		);

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
					id: 'arcgis-geocode-tool',
					position: ToolPosition.topleft,
					class: ArcGISGeocodeTool
				}
			];
			tools.forEach((toolDef) => {
				this.addToolFromDefinition(toolDef);
			});
			this._ready = true;
		})();
	}

	public addToolFromDefinition(def:ToolDefinition) {
		const t = new (def.class as any)(this._services, def.id, def.position, def.isDefault) as Tool;
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