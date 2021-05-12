import { makeObservable, observable } from "mobx";
import { ContainerInstance, Service } from "typedi";
import { Tool, ToolComponentProps, ToolPosition } from '../models/Tool';
import { IdentifyTool } from "../models/IdentifyTool";
import { FunctionComponent } from "react";
import { MeasureTool } from "../models/MeasureTool";

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
					id: 'measure-tool',
					position: ToolPosition.topleft,
					class: MeasureTool
				},{
					id: 'identify-tool',
					position: ToolPosition.none,
					class: IdentifyTool,
					isDefault: true
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