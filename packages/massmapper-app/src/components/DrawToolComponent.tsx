import {
	Radio,
	Grid,
	TextField,
	Paper,
	Button,
	RadioGroup,
	FormControlLabel,
	Dialog,
	DialogContent,
	DialogActions,
	MenuItem
} from '@material-ui/core'

import { observer, useLocalObservable } from 'mobx-react-lite';
import React, { FunctionComponent } from "react";
import { ToolComponentProps } from '../models/Tool';

import { MakeToolButtonComponent } from './MakeToolButtonComponent';
import { DrawTool } from '../models/DrawTool';
import { Delete, Gesture } from '@material-ui/icons';
import ColorPaletteComponent from './ColorPaletteComponent';
import { action } from 'mobx';

interface DrawToolComponentState {
	labelText: string,
	lengthScalar: string,
	lengthUnits: string,
	shapeType: string,
	color: string
}

const DrawToolComponent: FunctionComponent<ToolComponentProps> = observer(({tool: _tool}) => {
	const tool = _tool as DrawTool;

	const MeasureButton = MakeToolButtonComponent(Gesture, 'Click on the map to draw objects or add text');

	const myState = useLocalObservable<DrawToolComponentState>(() => {
		return {
			labelText: '',
			lengthUnits: 'feet',
			shapeType: 'circle',
			lengthScalar: '',
			color: 'Dark_Blue'
		}
	});

	return (
		<>
			<MeasureButton tool={tool}/>
			{tool.showTextEntryDialog && (
				<Dialog
					open
					onClose={() => {
						tool.showTextEntryDialog = false;
					}}
				>
					<DialogContent>
						<TextField
							onKeyDown={(e) => {
								e.stopPropagation();
							}}
							autoFocus
							onChange={(e) => {
								myState.labelText = e.target.value as string;
							}}
						/>
					</DialogContent>
					<DialogActions>
						<Button
							onClick={(e) => {
								tool.addText(myState.labelText);
							}}
						>
							Add Text to Map
						</Button>
					</DialogActions>
				</Dialog>
			)}
			{tool.isActive && tool.showPalette && (
				<Paper
					style={{
						position: 'absolute',
						top: '40px',
						width:'300px',
						margin: '0 1em',
					}}
					elevation={3}
				>
					<RadioGroup
						onChange={action((e) => {
							tool.drawMode = e.target.value as 'line' | 'text' | 'buffer' | 'point';
						})}
					>
						<Grid
							container
							direction="row"
							style={{
								margin: '1em 0'
							}}
						>
							<Grid
								item
								style={{
									width: '100%',
									margin: '0 1em'
								}}
							>
								<FormControlLabel value="line" control={<Radio checked={tool.drawMode === 'line'} />} label="Draw Lines" />
							</Grid>
							<Grid
								item
								style={{
									width: '100%'
								}}
							>
								<hr />
							</Grid>
							<Grid
								item
								style={{
									width: '100%',
									margin: '0 1em'
								}}
							>
								<FormControlLabel value="point" control={<Radio checked={tool.drawMode === 'point'} />} label="Draw Points" />
								<br />
								{tool.drawMode === 'point' && (
									<Grid
										item
										style={{
											width: '100%'
										}}
									>
										<TextField
											onKeyDown={(e) => {
												e.stopPropagation();
											}}
											select
											value={myState.shapeType}
											fullWidth
											label="Shape"
											onChange={(e) => {
												myState.shapeType = e.target.value as 'circle' | 'square' | 'star' | 'triangle' | 'x';
												tool.shapeType = e.target.value as 'circle' | 'square' | 'star' | 'triangle' | 'x';
											}}
										>
											<MenuItem value={'circle'}>dot</MenuItem>
											<MenuItem value={'square'}>square</MenuItem>
											<MenuItem value={'star'}>star</MenuItem>
											<MenuItem value={'triangle'}>triangle</MenuItem>
											<MenuItem value={'x'}>X</MenuItem>
										</TextField>
										<br />
										Click the map to add points
									</Grid>
								)}
							</Grid>
							<Grid
								item
								style={{
									width: '100%'
								}}
							>
								<hr />
							</Grid>
							<Grid
								item
								style={{
									width: '100%',
									margin: '0 1em'
								}}
							>
								<FormControlLabel value="buffer" control={<Radio checked={tool.drawMode === 'buffer'} />} label="Add Buffer" />
								<br />
								{tool.drawMode === 'buffer' && (
									<Grid
										item
										style={{
											width: '100%'
										}}
									>
										<TextField
											onKeyDown={(e) => {
												e.stopPropagation();
											}}
											value={myState.lengthScalar}
											type="number"
											label="Length (Radius)"
											onChange={(e) => {
												myState.lengthScalar = e.target.value;
												tool.lengthScalar = e.target.value as string;
											}}
										/>
										&nbsp;&nbsp;
										<TextField
											onKeyDown={(e) => {
												e.stopPropagation();
											}}
											select
											value={myState.lengthUnits}
											label="Units"
											onChange={(e) => {
												myState.lengthUnits = e.target.value as 'feet' | 'kilometers' | 'miles';
												tool.lengthUnits = e.target.value as 'feet' | 'kilometers' | 'miles';
											}}
										>
											<MenuItem value={'feet'}>ft</MenuItem>
											<MenuItem value={'kilometers'}>km</MenuItem>
											<MenuItem value={'miles'}>miles</MenuItem>
										</TextField>
										<br />
										{Number(myState.lengthScalar) > 0 && (
											<>
												Click the map to mark center of buffer
											</>
										)}
									</Grid>
								)}
							</Grid>
							<Grid
								item
								style={{
									width: '100%'
								}}
							>
								<hr />
							</Grid>
							<Grid
								item
								style={{
									width: '100%',
									margin: '0 1em'
								}}
							>
								<FormControlLabel value="text" control={<Radio checked={tool.drawMode === 'text'} />} label="Add Text" />
								<br />
								{tool.drawMode === 'text' && (
									<>
										Click the map to add text
									</>
								)}
							</Grid>
							<Grid
								item
								style={{
									width: '100%'
								}}
							>
								<hr />
							</Grid>
							<Grid
								item
								style={{
									width: '100%'
								}}
							>
								<ColorPaletteComponent
									onClick={(name, hex) => {
										tool.setColor(hex);
										myState.color = name;
									}}
									value={myState.color}
								/>
							</Grid>
							<Grid
								item
								style={{
									width: '100%'
								}}
							>
								<hr />
							</Grid>
							<Grid
								item
								style={{
									textAlign: 'center',
									width: '100%'
								}}
							>
								<Button
									style={{
										backgroundColor: 'white',
										minWidth: '32px',
									}}
									color="default"
									variant="text"
									size="small"
									title="Clear drawn objects and text"
									onClick={() => {
										tool.clearExistingShape();
									}}
								>
									Clear <Delete />
								</Button>
							</Grid>
						</Grid>
					</RadioGroup>
				</Paper>
			)}
		</>
	);
});

export { DrawToolComponent }