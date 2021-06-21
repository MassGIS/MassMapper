import React, { FunctionComponent } from "react";
import { ToolComponentProps } from "../models/Tool";
import { ShowCoordinatesTool, units } from "../models/ShowCoordinatesTool";
import { observer } from "mobx-react-lite";
import {
	Button,
	Menu,
	MenuItem,
	Paper,
	Typography,
} from "@material-ui/core";
import { ArrowDropDown } from "@material-ui/icons";

const ShowCoordinatesToolComponent: FunctionComponent<ToolComponentProps> = observer(({tool}) => {
	const myTool = tool as ShowCoordinatesTool;
	const handleClose = (e:any) => {
		myTool.isChangingUnits = false;
		myTool.units = e.target.getAttribute('value')
	}
	return (
		<Paper
			style={{
				height:'80%',
				padding: '0 1em',
				position: 'relative',
			}}
			elevation={3}
		>
			<div style={{
				position: 'relative',
				top: '11px',
				fontWeight: 'bold'
			}}>
				<Button
					style={{
						marginTop: '0',
						paddingTop: '0',
					}}
					ref={(r:HTMLButtonElement) => {
						myTool.buttonRef = r;
					}}
					onClick={() => {
						myTool.isChangingUnits = true;
					}}
					>
					{myTool.xCoord}
					,&nbsp;
					{myTool.yCoord}
					&nbsp;&nbsp;&nbsp;&nbsp;
					<Typography
						variant="caption"
					>
						{myTool.units}
					</Typography>
					<ArrowDropDown />
				</Button>
				<Menu
					keepMounted
					open={myTool.isChangingUnits}
					onClose={() => {
						myTool.isChangingUnits = false;
					}}
					anchorEl={myTool.buttonRef}
					style={{
						// width: '4em'
					}}
					// variant="standard"
				>
					<MenuItem onClick={handleClose} value={units.DMS}>lat/lon (dms)</MenuItem>
					<MenuItem onClick={handleClose} value={units.DD}>lat/lon (dd)</MenuItem>
					<MenuItem onClick={handleClose} value={units.SP_METERS}>SP Meters</MenuItem>
					<MenuItem onClick={handleClose} value={units.SP_FEET}>SP Feet</MenuItem>
				</Menu>
			</div>
		</Paper>
	)
});

export { ShowCoordinatesToolComponent }