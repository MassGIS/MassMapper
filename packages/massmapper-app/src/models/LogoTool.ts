import { Tool, ToolPosition } from "./Tool";

// import './MeasureTool.module.css';
import { LogoToolComponent } from '../components/LogoToolComponent';

class LogoTool extends Tool {

	protected async _deactivate() {
		// no-op, never de-activates
	}

	protected async _activate() {
		// no-op, never activates
	}

	public component() {
		return LogoToolComponent
	}
}

export { LogoTool };