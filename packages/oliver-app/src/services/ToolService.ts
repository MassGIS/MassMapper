import { action, makeObservable, observable } from "mobx";
import { ContainerInstance, Service } from "typedi";
import { MapService } from "./MapService";
import { Tool } from '../models/Tool';
import { IdentifyTool } from "../models/IdentifyTool";

type ToolServiceAnnotations = '_tools' | '_ready';

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
				'Click on the map to identify features'
			);
			this.addTool(identifyTool);
			this.activateTool(identifyTool.id);

			this._ready = true;
		})();
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

		t.enabled = true;
		this._tools.set(t.id, t);
	}

	public removeTool(t: Tool): boolean {
		return this._tools.delete(t.id);
	}
}

export { ToolService };