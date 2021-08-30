import {
	Radio,
	Grid,
	TextField,
	Paper,
	MenuItem,
	Button
} from '@material-ui/core'

import { observer } from 'mobx-react-lite';
import React, { FunctionComponent } from "react";
import { ToolComponentProps } from '../models/Tool';

import { MakeToolButtonComponent } from './MakeToolButtonComponent';
import { DrawTool } from '../models/DrawTool';
import { Delete, Gesture } from '@material-ui/icons';
import ColorPaletteComponent from './ColorPaletteComponent';

const DrawToolComponent: FunctionComponent<ToolComponentProps> = observer(({tool: _tool}) => {
	const tool = _tool as DrawTool;

	const MeasureButton = MakeToolButtonComponent(Gesture, 'Click to draw lines');

	return (
		<>
			<MeasureButton tool={tool}/>
			{tool.isActive && (
				<Paper
					style={{
						position: 'absolute',
						top: '40px',
						width:'300px',
						// width: '28em',
					}}
					elevation={3}
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
								width: '100%'
							}}
						>
							<ColorPaletteComponent
								onClick={(name, hex) => {
									tool.setLineColor(hex);
								}}
							/>
						</Grid>
						<Grid
							item
							style={{
								textAlign: 'center',
								width: '100%'
							}}
						>
							<hr />
							<Button
								style={{
									backgroundColor: 'white',
									minWidth: '32px',
								}}
								color="default"
								variant="text"
								size="small"
								title="Clear drawn lines"
								onClick={() => {
									tool.clearExistingShape();
								}}
							>
								Clear <Delete />
							</Button>
						</Grid>
					</Grid>
				</Paper>
			)}
		</>
	);
});

export { DrawToolComponent }