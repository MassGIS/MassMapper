import { makeObservable, observable, computed } from "mobx";
import { FunctionComponent } from "react";
import { ContainerInstance } from "typedi";
import { ToolService } from "../services/ToolService";

enum ToolPosition {
	topright,
	bottomright,
	topleft,
	bottomleft,
	none
}

interface ToolComponentProps {
	tool: Tool;
}

abstract class Tool {
	protected _active: boolean = false;
	protected _isButton: boolean = false;

	get isActive():boolean {
		return this._active;
	}

	get isDefault():boolean {
		return this._default;
	}

	constructor(
		protected readonly _services:ContainerInstance,
		public readonly id:string,
		public position: ToolPosition,
		protected _default: boolean = false
	) {
		// makeObservable<Tool, ToolAnnotations>(
		makeObservable<Tool, '_active'>(
			this,
			{
				_active: observable,
				position: observable,
				isActive: computed
			}
		);
	}

	protected abstract _activate(): Promise<void>;
	protected abstract _deactivate(): Promise<void>;

	public async activate(): Promise<void> {
		if (this._isButton) {
			await this._activate();
			return;
		}

		const toolService = this._services.get(ToolService);
		toolService.tools.forEach((t) => {
			if (t !== this) {
				t.deactivate();
			}
		});

		if (this._active) {
			return;
		}

		await this._activate();
		this._active = true;
	};

	public async deactivate(restoreDefaultTool:boolean = false): Promise<void> {
		await this._deactivate();
		this._active = false;
		if (restoreDefaultTool) {
			const toolService = this._services.get(ToolService);
			const defaultTool = toolService.tools.filter((t) => t.isDefault)[0];
			defaultTool.activate();
		}
	};

	public abstract component(): FunctionComponent<ToolComponentProps>;
}

export { Tool, ToolPosition, ToolComponentProps };