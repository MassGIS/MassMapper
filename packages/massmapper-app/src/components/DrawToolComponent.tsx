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
	DialogActions
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
	labelText: string;
}

const DrawToolComponent: FunctionComponent<ToolComponentProps> = observer(({tool: _tool}) => {
	const tool = _tool as DrawTool;

	const MeasureButton = MakeToolButtonComponent(Gesture, 'Click on the map to draw lines or add text');

	const myState = useLocalObservable<DrawToolComponentState>(() => {
		return {
			labelText: '',
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
							tool.drawMode = e.target.value as 'line'|'text';
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
								<ColorPaletteComponent
									onClick={(name, hex) => {
										tool.setLineColor(hex);
									}}
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
									width: '100%',
									margin: '0 1em'
								}}
							>
								<FormControlLabel value="text" control={<Radio />} label="Add Text" />
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
									title="Clear drawn lines and text"
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