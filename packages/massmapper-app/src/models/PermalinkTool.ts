import { MapService } from "../services/MapService";
import { Tool } from "./Tool";
import link from '../images/link.png';

import './MeasureTool.module.css';
import { MakeToolButtonComponent } from '../components/MakeToolButtonComponent';

class PermalinkTool extends Tool {

	protected _isButton = true;

	protected async _deactivate() {
		// no-op
	}

	protected async _activate() {
		const ms = this._services.get(MapService);
		const permalink = document.location.href.split("?")[0] + "?" + ms.permalink;
		const copyEl = document.createElement('input');
		copyEl.style.position = 'absolute';
		copyEl.style.left = '-10000px';
		const body = document.getElementsByTagName('body')[0];
		body.appendChild(copyEl);
		copyEl.value = permalink;
		copyEl.select();
		copyEl.setSelectionRange(0, 99999); /*For mobile devices*/

		/* Copy the text inside the text field */
		document.execCommand('copy');
		alert('A link to this record has been copied to your clipboard. Paste your permalink using Edit -> Paste, or <Ctrl + V>');
	}

	public component() {
		// return MeasureToolComponent;
		return MakeToolButtonComponent(link, 'Click to create a permalink');
	}
}

export { PermalinkTool };