import { makeObservable, observable } from "mobx";
import { ContainerInstance } from "typedi";
import { MapService } from "../services/MapService";

// type ToolAnnotations = '_isLoading' | '_toolData';

abstract class Tool {
	public enabled: boolean = false;

	constructor(
		protected readonly _services:ContainerInstance,
		public readonly id:string,
		public tooltip:string
	) {
		// makeObservable<Tool, ToolAnnotations>(
		makeObservable<Tool>(
			this,
			{
				enabled: observable,
				tooltip: observable
			}
		);
	}

	public abstract activate(): Promise<void>;

	public abstract deactivate(): Promise<void>;
}

export { Tool };