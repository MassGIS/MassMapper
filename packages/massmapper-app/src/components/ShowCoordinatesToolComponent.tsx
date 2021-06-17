import React, { FunctionComponent } from "react";
import { ToolComponentProps } from "../models/Tool";
import { ShowCoordinatesTool } from "../models/ShowCoordinatesTool";
import { observer } from "mobx-react-lite";
import { Paper } from "@material-ui/core";

const ShowCoordinatesToolComponent: FunctionComponent<ToolComponentProps> = observer(({tool}) => {
	const myTool = tool as ShowCoordinatesTool;
	return (
		<Paper
			style={{
				height:'80%',
				padding: '0 1em',
				position: 'relative',
				top: '5px'
			}}
			elevation={3}
		>
			<div style={{
				position: 'relative',
				top: '11px',
				fontWeight: 'bold'
			}}>
				lat: {myTool.xCoord} &nbsp; lon:{myTool.yCoord}
			</div>
		</Paper>
	)
});

export { ShowCoordinatesToolComponent }