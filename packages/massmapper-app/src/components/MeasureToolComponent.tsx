import { observer } from "mobx-react";
import React, { FunctionComponent } from 'react';
import { ToolComponentProps } from "../models/Tool";
import { Button } from '@material-ui/core';
import ruler from '../images/ruler.png';

const MeasureToolComponent: FunctionComponent<ToolComponentProps> = observer(({tool}) => {
	return (
		<>
			<Button
				style={{
					backgroundColor: 'white'
				}}
				title="Click to measure distances"
				variant="outlined"
				onClick={() => {
					tool.activate();
				}}
			>
				<img
					style={{
						width: '24px'
					}}
					src={ruler}
				/>
			</Button>
			{tool.isActive && (<MeasureToolDialog tool={tool} />)}
		</>
	);
});

const MeasureToolDialog: FunctionComponent<ToolComponentProps> = observer(({tool}) => {
	return (
		<div
			style={{
				position: 'absolute',
				width: '250px',
				height: '200px',
				backgroundColor: 'white',
				top: '50px',
				padding: '3px',
				borderRadius: '5px',
				border: '1px solid gray'
			}}
		>
			Length:
		</div>
	);
});


export { MeasureToolComponent };