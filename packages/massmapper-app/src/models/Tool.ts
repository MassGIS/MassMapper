import { makeObservable, observable } from "mobx";
import { FunctionComponent } from "react";
import { RouteComponentProps } from "react-router";
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
	private _active: boolean = false;

	get isActive():boolean {
		return this._active;
	}

	constructor(
		protected readonly _services:ContainerInstance,
		public readonly id:string,
		public position: ToolPosition
	) {
		// makeObservable<Tool, ToolAnnotations>(
		makeObservable<Tool, '_active'>(
			this,
			{
				_active: observable,
				position: observable
			}
		);
	}

	public async activate(): Promise<void> {
		const toolService = this._services.get(ToolService);
		// toolService.deactivateTools
		this._active = true;
	};

	public abstract deactivate(): Promise<void>;

	public abstract component(): FunctionComponent<ToolComponentProps>;
}

export { Tool, ToolPosition, ToolComponentProps };