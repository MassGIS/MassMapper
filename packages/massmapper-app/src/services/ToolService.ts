import { autorun, computed, makeObservable, observable } from "mobx";
import { ContainerInstance, Service } from "typedi";
import { Tool, ToolPosition } from '../models/Tool';
import { MapService } from "./MapService";
import { ConfigService } from "./ConfigService";

import { IdentifyToolWithPoint } from "../models/IdentifyToolWithPoint";
import { MeasureTool } from "../models/MeasureTool";
import { IdentifyToolWithBox } from "../models/IdentifyToolWithBox";
import { PermalinkTool } from "../models/PermalinkTool";
import { LogoTool } from "../models/LogoTool";
import { GoogleGeocodeTool } from "../models/GoogleGeocodeTool";
import { ArcGISGeocodeTool } from "../models/ArcGISGeocodeTool";
import { ShowCoordinatesTool } from "../models/ShowCoordinatesTool";
import { AbuttersTool } from "../models/AbuttersTool";
import { PrintPdfTool } from "../models/PrintPdfTool";
import { ZoomToMaxExtentTool } from '../models/ZoomToMaxExtentTool';
import { ExportWizardTool } from "../models/ExportWizardTool";
import { ExtentHistoryTool } from "../models/ExtentHistoryTool";
import { HelpTool } from "../models/HelpTool";

type ToolServiceAnnotations = '_tools' | '_ready';
interface ToolDefinition {
	id: string;
	position: ToolPosition;
	class: typeof Tool;
	isDefault?: boolean;
	options?: any;
}

const ToolRegistry:Map<string, typeof Tool> = new Map();
ToolRegistry.set('IdentifyToolWithPoint', IdentifyToolWithPoint);
ToolRegistry.set('MeasureTool', MeasureTool);
ToolRegistry.set('IdentifyToolWithBox', IdentifyToolWithBox);
ToolRegistry.set('PermalinkTool', PermalinkTool);
ToolRegistry.set('LogoTool', LogoTool);
ToolRegistry.set('GoogleGeocodeTool', GoogleGeocodeTool);
ToolRegistry.set('ArcGISGeocodeTool', ArcGISGeocodeTool);
ToolRegistry.set('ShowCoordinatesTool', ShowCoordinatesTool);
ToolRegistry.set('AbuttersTool', AbuttersTool);
ToolRegistry.set('PrintPdfTool', PrintPdfTool);
ToolRegistry.set('ZoomToMaxExtentTool', ZoomToMaxExtentTool);
ToolRegistry.set('ExportWizardTool', ExportWizardTool)
ToolRegistry.set('ExtentHistoryTool', ExtentHistoryTool);
ToolRegistry.set('HelpTool', HelpTool);

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

		autorun(async (r) => {
			// await delay(0); // have to wait for the constructor to finish initing, and get added to the service to get registered

			const cs = this._services.get(ConfigService);
			if (!cs.ready) {
				return;
			}

			const pathParts = document.location.pathname.split('/');
			const fileName = pathParts[pathParts.length - 1];
			const resp = await fetch(
				`config/${fileName.split('.')[0]}.json`,
				{
					'cache': 'no-cache'
				}
			);

			const config = await resp.json() as any;

			// const tools:Array<ToolDefinition> = cs.toolDefs;
			const tools:Array<ToolDefinition> = config.tools;

			for (const toolDef of tools) {
				if (!ToolRegistry.has(toolDef.class as any as string)) {
					console.error("error: couldn't resolve tool class", toolDef.class);
					continue;
				}
				toolDef.class = ToolRegistry.get(toolDef.class as any as string)!;
				this.addToolFromDefinition(toolDef);
			}

			this._ready = true;
			r.dispose();
		});
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