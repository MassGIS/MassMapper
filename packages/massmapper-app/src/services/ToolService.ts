import { makeObservable, observable } from "mobx";
import { ContainerInstance, Service } from "typedi";
import { Tool, ToolComponentProps, ToolPosition } from '../models/Tool';
import { IdentifyTool } from "../models/IdentifyTool";
import { FunctionComponent } from "react";

type ToolServiceAnnotations = '_tools' | '_ready';
interface ToolDefinition {
	id: string;
	position: ToolPosition;
	class: typeof Tool;
}
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
			const identifyTool = new IdentifyTool(
				_services,
				'identify-tool',
				ToolPosition.none
			);
			this.addTool(identifyTool);
			this.activateTool(identifyTool.id);

			this._ready = true;
		})();
	}

	public addToolFromDefinition(def:ToolDefinition) {
		const t = new (def.class as any)(this._services, def.id, def.position) as Tool;
		this.addTool(t);
	}

	public getTools(p:ToolPosition): Array<Tool> {
		return Array.from(this._tools.values())
			.filter((t) => t.position === p);
	}

	public activateTool(id:string) {
		this._activeToolId = id;
		this.activeTool?.activate();
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