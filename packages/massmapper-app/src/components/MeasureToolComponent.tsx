import { observer } from "mobx-react";
import React, { FunctionComponent } from 'react';
import { ToolComponentProps } from "../models/Tool";
import { Button } from '@material-ui/core';
import ruler from '../images/ruler.png';
import { MeasureTool } from "../models/MeasureTool";

const MeasureToolComponent: FunctionComponent<ToolComponentProps> = observer(({tool}) => {
	const measureTool = tool as MeasureTool;
	return (
		<>
			<Button
				style={{
					backgroundColor: tool.isActive ? '' : 'white'
				}}
				color="default"
				title="Click to measure distances"
				variant="contained"
				onClick={() => {
					tool.isActive ? tool.deactivate(true) : tool.activate();
				}}
			>
				<img
					style={{
						width: '24px'
					}}
					src={ruler}
				/>
			</Button>
			{tool.isActive && measureTool.totalLength && (<MeasureToolDialog tool={tool} />)}
		</>
	);
});

const MeasureToolDialog: FunctionComponent<ToolComponentProps> = observer(({tool}) => {
	const measureTool = tool as MeasureTool
	return (
		<div
			style={{
				position: 'absolute',
				// width: '250px',
				// height: '200px',
				backgroundColor: 'white',
				top: '50px',
				left: '0',
				padding: '1em',
				borderRadius: '5px',
				border: '1px solid gray'
			}}
		>
			<p style={{
				whiteSpace: 'nowrap'
			}}>{measureTool.totalLength}</p>
		</div>
	);
});


export { MeasureToolComponent };