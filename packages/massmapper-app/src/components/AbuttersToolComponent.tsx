import {
	Button,
	Radio,
	Grid,
	TextField,
	Paper,
	MenuItem
} from '@material-ui/core'
import {
	Streetview,
} from '@material-ui/icons';
import { observer } from 'mobx-react-lite';
import React, { FunctionComponent } from "react";
import { ToolComponentProps } from '../models/Tool';
import { MapService } from '../services/MapService';
import { useService } from '../services/useService';

import { AbuttersTool } from '../models/AbuttersTool';

const AbuttersToolComponent: FunctionComponent<ToolComponentProps> = observer(({tool}) => {
	const [mapService] = useService([MapService]);
	const myTool = tool as AbuttersTool;

	const button = (
		<Button
			style={{
				backgroundColor: tool.isActive ? '' : 'white',
				minWidth: '32px',
			}}
			color="default"
			title={'Click on the map to generate an abutters list'}
			variant="contained"
			size="small"
			onClick={() => {
				tool.isActive ? tool.deactivate(true) : tool.activate();
			}}
		>
			<Streetview />
		</Button>
	);

	return (
		<>
			{button}
			{tool.isActive && (
				<Paper
					style={{
						position: 'absolute',
						top: '50px',
						right: '-100px',
						// width:'410px',
						width: '28em',
					}}
					elevation={3}
				>
					<Grid
						container
						direction="row"
						style={{
							margin: '1em'
						}}
					>
						<Grid
							item
							style={{
								width: '100%'
							}}
						>
							<TextField
								value={myTool.buffer !== undefined ? myTool.buffer : ''}
								required
								helperText="buffer distance"
								onClick={(x) => {
									(x.target as HTMLInputElement).select();
								}}
								onChange={(e) => {
									const newVal = parseInt(e.target.value);
									if (newVal === 0) {
										myTool.buffer = 1;
									} else {
										myTool.buffer = newVal || 1;
									}
								}}
							/>
							&nbsp;&nbsp;
							<TextField
								select
								value={myTool.units}
								onChange={(e) => {
									myTool.units = (e.target.value as 'ft' | 'm');
								}}
								style={{
									width: '4em'
								}}
								// variant="standard"
							>
								<MenuItem value={'ft'}>ft</MenuItem>
								<MenuItem value={'m'}>m</MenuItem>
							</TextField>
						</Grid>
					</Grid>
				</Paper>
			)}
		</>
	);
});

export { AbuttersToolComponent }