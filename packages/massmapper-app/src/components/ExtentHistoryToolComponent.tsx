import {
	ArrowBack,
	ArrowForward
} from '@material-ui/icons'

import { observer } from 'mobx-react-lite';
import React, { FunctionComponent } from "react";
import { ToolComponentProps } from '../models/Tool';

import { ExtentHistoryTool } from '../models/ExtentHistoryTool';
import { MakeToolButtonComponent } from './MakeToolButtonComponent';

const ExtentHistoryToolComponent: FunctionComponent<ToolComponentProps> = observer(({tool: _tool}) => {
	const tool = _tool as ExtentHistoryTool;

	const PreviousExtentButton = MakeToolButtonComponent(
		ArrowBack,
		'Go to previous extent',
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
		'Go to next extent',
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

export { ExtentHistoryToolComponent }