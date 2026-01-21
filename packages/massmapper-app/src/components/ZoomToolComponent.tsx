import {
	Add,
	Remove
} from '@material-ui/icons'

import { observer } from 'mobx-react-lite';
import React, { FunctionComponent } from "react";
import { ToolComponentProps } from '../models/Tool';

import { ZoomTool } from '../models/ZoomTool';
import { MakeToolButtonComponent } from './MakeToolButtonComponent';

const ZoomToolComponent: FunctionComponent<ToolComponentProps> = observer(({tool: _tool}) => {
	const tool = _tool as ZoomTool;

	const ZoomInButton = MakeToolButtonComponent(
		Add,
		'Zoom In',
		(e) => {
			tool.zoomIn();
		},
		undefined,
		{
			minWidth: '30px',
			maxWidth: '30px',
		}
	);
	const ZoomOutButton = MakeToolButtonComponent(
		Remove,
		'Zoom Out',
		(e) => {
			tool.zoomOut();
		},
		undefined,
		{
			minWidth: '30px',
			maxWidth: '30px',
		}
	);

	return (
		<>
			<div style={{
				marginBottom: '.5em'
			}}>
				<ZoomInButton
					tool={tool}
				/>
			</div>
			<div>
				<ZoomOutButton
					tool={tool}
				/>
			</div>
		</>
	);
});

export { ZoomToolComponent }