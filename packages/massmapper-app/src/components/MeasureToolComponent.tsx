import {
	Radio,
	Grid,
	TextField,
	Paper,
	Select,
	MenuItem
} from '@material-ui/core'
import {
	ArrowBack,
	Close,
	Explore,
	ImageSearch,
	Search,
} from '@material-ui/icons';
import { latLngBounds, latLng } from 'leaflet';
import { observer, useLocalObservable } from 'mobx-react-lite';
import React, { FunctionComponent } from "react";
import { ToolComponentProps } from '../models/Tool';
import { MapService } from '../services/MapService';
import { useService } from '../services/useService';

import ruler from '../images/ruler.png';
import { MakeToolButtonComponent } from './MakeToolButtonComponent';
import { MeasureTool } from '../models/MeasureTool';

const MeasureToolComponent: FunctionComponent<ToolComponentProps> = observer(({tool}) => {
	const [mapService] = useService([MapService]);
	const myTool = tool as MeasureTool;

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
								checked={myTool.measureMode === 'Length'}
								onClick={() => {
									myTool.measureMode = 'Length';
								}}
							/>
							<div style={{
								width: '4em',
								display: 'inline-block',
								color: myTool.measureMode === 'Length' ? '' : 'gray'
							}}>
								Length:
							</div>
							<TextField
								value={myTool.totalLength}
								onChange={() => {
									return false;
								}}
							/>
							&nbsp;&nbsp;
							<TextField
								select
								value={myTool.lengthUnits}
								onChange={(e) => {
									myTool.lengthUnits = (e.target.value as 'ft' | 'm' | 'mi');
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
								checked={myTool.measureMode === 'Area'}
								onClick={() => {
									myTool.measureMode = 'Area';
								}}
							/>
							<div style={{
								width: '4em',
								display: 'inline-block',
								color: myTool.measureMode === 'Area' ? '' : 'gray'
							}}>
								Area:
							</div>
							<TextField
								value={myTool.measureMode === 'Area' && myTool.totalArea || ''}
								onChange={() => {
									return false;
								}}
							/>&nbsp;&nbsp;
							<TextField
								select
								value={myTool.areaUnits}
								onChange={(e) => {
									myTool.areaUnits = (e.target.value as 'sq ft' | 'acres' | 'sq meters' | 'sq mi');
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