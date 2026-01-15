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
	shapeSize: string,
	color: string,
	linePattern: string,
	lineWeight: string,
	textSize: string,
	textStyle: string
}

const DrawToolComponent: FunctionComponent<ToolComponentProps> = observer(({tool: _tool}) => {
	const tool = _tool as DrawTool;

	const MeasureButton = MakeToolButtonComponent(Gesture, 'Draw');

	const myState = useLocalObservable<DrawToolComponentState>(() => {
		return {
			labelText: '',
			lengthUnits: 'feet',
			shapeType: 'circle',
			shapeSize: 'small',
			lengthScalar: '',
			color: 'Dark_Blue',
			linePattern: 'solid',
			lineWeight: 'medium',
			textSize: 'medium',
			textStyle: 'normal'
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
								<br />
								{tool.drawMode === 'line' && (
									<Grid
										container
										spacing={2}
									>
										<Grid item md={6}>
											<TextField
												onKeyDown={(e) => {
													e.stopPropagation();
												}}
												select
												fullWidth
												value={myState.linePattern}
												label="Pattern"
												onChange={(e) => {
													myState.linePattern = e.target.value as 'solid' | 'short-dash' | 'long-dash' | 'dots';
													tool.linePattern = e.target.value as 'solid' | 'short-dash' | 'long-dash' | 'dots';
													tool.setDrawLineOptions();
												}}
											>
												<MenuItem value={'solid'}>solid</MenuItem>
												<MenuItem value={'short-dash'}>short-dash</MenuItem>
												<MenuItem value={'long-dash'}>long-dash</MenuItem>
												<MenuItem value={'dots'}>dots</MenuItem>
											</TextField>
										</Grid>
										<Grid item md={6}>
											<TextField
												onKeyDown={(e) => {
													e.stopPropagation();
												}}
												select
												fullWidth
												value={myState.lineWeight}
												label="Weight"
												onChange={(e) => {
													myState.lineWeight = e.target.value as 'thin' | 'medium' | 'thick';
													tool.lineWeight = e.target.value as 'thin' | 'medium' | 'thick';
													tool.setDrawLineOptions();
												}}
											>
												<MenuItem value={"thin"}>thin</MenuItem>
												<MenuItem value={"medium"}>medium</MenuItem>
												<MenuItem value={"thick"}>thick</MenuItem>
											</TextField>
										</Grid>
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
								<FormControlLabel value="point" control={<Radio checked={tool.drawMode === 'point'} />} label="Draw Points" />
								<br />
								{tool.drawMode === 'point' && (
									<Grid
										container
										spacing={2}
									>
										<Grid item md={6}>
											<TextField
												onKeyDown={(e) => {
													e.stopPropagation();
												}}
												select
												fullWidth
												value={myState.shapeType}
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
										</Grid>
										<Grid item md={6}>
											<TextField
												onKeyDown={(e) => {
													e.stopPropagation();
												}}
												select
												fullWidth
												value={myState.shapeSize}
												label="Size"
												onChange={(e) => {
													myState.shapeSize = e.target.value as 'small' | 'medium' | 'large';
													tool.shapeSize = e.target.value as 'small' | 'medium' | 'large';
												}}
											>
												<MenuItem value={"small"}>small</MenuItem>
												<MenuItem value={"medium"}>medium</MenuItem>
												<MenuItem value={"large"}>large</MenuItem>
											</TextField>
										</Grid>
										<Grid item md={12}>
										<TextField
											value={tool.lastCoordinate}
											fullWidth
											disabled
											size="small"
											variant="standard"
											label="Most recent coordinates"
										>
										</TextField>
										</Grid>
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
										container
										spacing={2}
									>
										<Grid	item md={6}>
											<TextField
												onKeyDown={(e) => {
													e.stopPropagation();
												}}
												fullWidth
												value={myState.lengthScalar}
												type="number"
												label="Length (Radius)"
												onChange={(e) => {
													myState.lengthScalar = e.target.value;
													tool.lengthScalar = e.target.value as string;
												}}
											/>
										</Grid>
										<Grid	item md={6}>
											<TextField
												onKeyDown={(e) => {
													e.stopPropagation();
												}}
												select
												fullWidth
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
										</Grid>
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
								<br/>
								{tool.drawMode === 'text' && (
									<Grid
										container
										spacing={2}
									>
										<Grid item md={6}>
											<TextField
												onKeyDown={(e) => {
													e.stopPropagation();
												}}
												select
												fullWidth
												value={myState.textStyle}
												label="Style"
												onChange={(e) => {
													myState.textStyle = e.target.value as 'normal' | 'bold' | 'italic';
													tool.textStyle = e.target.value as 'normal' | 'bold' | 'italic';
												}}
											>
												<MenuItem value={'normal'}>normal</MenuItem>
												<MenuItem value={'bold'}>bold</MenuItem>
												<MenuItem value={'italic'}>italic</MenuItem>
											</TextField>
										</Grid>
										<Grid item md={6}>
											<TextField
												onKeyDown={(e) => {
													e.stopPropagation();
												}}
												select
												fullWidth
												value={myState.textSize}
												label="Size"
												onChange={(e) => {
													myState.textSize = e.target.value as 'small' | 'medium' | 'large';
													tool.textSize = e.target.value as 'small' | 'medium' | 'large';
												}}
											>
												<MenuItem value={"small"}>small</MenuItem>
												<MenuItem value={"medium"}>medium</MenuItem>
												<MenuItem value={"large"}>large</MenuItem>
											</TextField>
										</Grid>
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