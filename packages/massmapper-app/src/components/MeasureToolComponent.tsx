import {
	Radio,
	Grid,
	TextField,
	Paper,
	MenuItem
} from '@material-ui/core'

import { observer } from 'mobx-react-lite';
import React, { FunctionComponent } from "react";
import { ToolComponentProps } from '../models/Tool';

import ruler from '../images/ruler.png';
import { MakeToolButtonComponent } from './MakeToolButtonComponent';
import { MeasureTool } from '../models/MeasureTool';

const MeasureToolComponent: FunctionComponent<ToolComponentProps> = observer(({tool: _tool}) => {
	const tool = _tool as MeasureTool;

	const MeasureButton = MakeToolButtonComponent(ruler, 'Click to measure distances');

	return (
		<>
			<MeasureButton tool={tool}/>
			{tool.isActive && (
				<Paper
					style={{
						position: 'absolute',
						top: '40px',
						// width:'410px',
						width: '28em',
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
							<Radio
								checked={tool.measureMode === 'Length'}
								onClick={() => {
									tool.measureMode = 'Length';
								}}
							/>
							<div style={{
								width: '4em',
								display: 'inline-block',
								color: tool.measureMode === 'Length' ? '' : 'gray'
							}}>
								Length:
							</div>
							<TextField
								value={tool.totalLength}
								onChange={() => {
									return false;
								}}
							/>
							&nbsp;&nbsp;
							<TextField
								select
								value={tool.lengthUnits}
								onChange={(e) => {
									tool.lengthUnits = (e.target.value as 'ft' | 'm' | 'mi');
								}}
								style={{
									width: '4em'
								}}
								// variant="standard"
							>
								<MenuItem value={'ft'}>ft</MenuItem>
								<MenuItem value={'m'}>m</MenuItem>
								<MenuItem value={'mi'}>mi</MenuItem>
							</TextField>
						</Grid>
						<Grid
							item
							style={{
								width: '100%'
							}}
						>
							<Radio
								checked={tool.measureMode === 'Area'}
								onClick={() => {
									tool.measureMode = 'Area';
								}}
							/>
							<div style={{
								width: '4em',
								display: 'inline-block',
								color: tool.measureMode === 'Area' ? '' : 'gray'
							}}>
								Area:
							</div>
							<TextField
								value={tool.measureMode === 'Area' && tool.totalArea || ''}
								onChange={() => {
									return false;
								}}
							/>&nbsp;&nbsp;
							<TextField
								select
								value={tool.areaUnits}
								onChange={(e) => {
									tool.areaUnits = (e.target.value as 'sq ft' | 'acres' | 'sq meters' | 'sq mi');
								}}
								style={{
									width: '4em'
								}}
								// variant="standard"
							>
								<MenuItem value={'sq ft'}>sq ft</MenuItem>
								<MenuItem value={'acres'}>acres</MenuItem>
								<MenuItem value={'sq meters'}>sq meters</MenuItem>
								<MenuItem value={'sq mi'}>sq mi</MenuItem>
							</TextField>
						</Grid>
					</Grid>
				</Paper>
			)}
		</>
	);
});

export { MeasureToolComponent }