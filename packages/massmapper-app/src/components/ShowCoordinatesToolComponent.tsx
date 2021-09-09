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
				height:'60%',
				padding: '0 .2em',
				position: 'relative',
				top: '10px'
			}}
			elevation={3}
		>
			<div style={{
				position: 'relative',
				top: '3px',
			}}>
				<Button
					style={{
						marginTop: '0',
						paddingTop: '0',
						fontWeight: 100,
						fontSize: 'smaller',
						width: myTool.units === units.DMS ? '27em' : '',
						justifyContent: 'left'
					}}
					ref={(r:HTMLButtonElement) => {
						myTool.buttonRef = r;
					}}
					onClick={() => {
						myTool.isChangingUnits = true;
					}}
				>
					<div style={{
						width: myTool.units === units.DMS ? '14em' : '',
						textAlign: 'left',
						marginRight: '1em'
					}}>
						{myTool.xCoord}
						,&nbsp;
						{myTool.yCoord}
					</div>
					<div style={{
						float: 'right'
					}}>
						<Typography
							variant="caption"
							style={{
								verticalAlign: 'super'
							}}
						>
							{myTool.units}
						</Typography>
						<ArrowDropDown />
					</div>
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