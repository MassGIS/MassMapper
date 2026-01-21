import {
	ArrowBack,
	ArrowForward
} from '@material-ui/icons'

import { observer } from 'mobx-react-lite';
import React, { FunctionComponent } from "react";
import { ToolComponentProps } from '../models/Tool';

import { ZoomTool } from '../models/ZoomTool';
import { MakeToolButtonComponent } from './MakeToolButtonComponent';

const ZoomToolComponent: FunctionComponent<ToolComponentProps> = observer(({tool: _tool}) => {
	const tool = _tool as ZoomTool;

	const PreviousExtentButton = MakeToolButtonComponent(
		ArrowBack,
		'Previous Zoom',
		(e) => {
			tool.back();
		},
		undefined,
		{
			minWidth: '30px',
			maxWidth: '30px',
		}
	);
	const NextExtentButton = MakeToolButtonComponent(
		ArrowForward,
		'Next Zoom',
		(e) => {
			tool.forward();
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
				<PreviousExtentButton
					tool={tool}
				/>
			</div>
			<div>
				<NextExtentButton
					tool={tool}
				/>
			</div>
		</>
	);
});

export { ZoomToolComponent }