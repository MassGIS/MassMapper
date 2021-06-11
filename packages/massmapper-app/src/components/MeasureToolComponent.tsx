import {
	Radio,
	Grid,
	TextField,
	Paper
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
						width:'20vw',
						minWidth: '315px',
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
							/>
						</Grid>
					</Grid>
				</Paper>
			)}
		</>
	);

	// return (
	// 	<Dialog
	// 		open
	// 		onClose={() => {
	// 			myState.isOpen = false;
	// 			myState.city = '';
	// 			myState.zip = '';
	// 			myState.street = '';
	// 			myState.results = [];
	// 		}}
	// 	>
	// 		<DialogTitle>
	// 			{myState.results.length > 0 ? 'Search Results' : 'Location Search'}
	// 		</DialogTitle>
	// 		<Grid
	// 			style={{
	// 				flexGrow: 1,
	// 				height: '40vh',
	// 			}}
	// 		>
	// 			{myState.results.length > 0 && (<ResultsComponent uiState={myState} />)}
	// 			{myState.results.length === 0 && (<SearchComponent uiState={myState} />)}
	// 			<Grid
	// 				style={{
	// 					height: '15%',
	// 					textAlign: 'center'
	// 				}}
	// 			>
	// 				<Button
	// 					onClick={() => {
	// 						myState.isOpen = false;
	// 						myState.results = [];
	// 					}}
	// 					variant="contained"
	// 				>
	// 					<Close /> Close
	// 				</Button>
	// 			</Grid>
	// 		</Grid>
	// 	</Dialog>
	// );
});

// const SearchComponent: FunctionComponent<{uiState: MeasureToolComponentState}> = observer(({uiState}) => {
// 	return (
// 		<Grid
// 			style={{
// 				height: '85%',
// 				marginLeft: '2em'
// 			}}
// 		>
// 			<TextField
// 				variant="outlined"
// 				style={{
// 					width:'80%',
// 					marginBottom:'.5em',
// 				}}
// 				helperText="Address is required"
// 				value={uiState.street}
// 				placeholder="Address..."
// 				onChange={(e) => {
// 					uiState.street = e.target.value;
// 				}}
// 			/>
// 			<TextField
// 				variant="outlined"
// 				style={{
// 					width:'80%',
// 					marginBottom:'.5em',
// 				}}
// 				helperText="City or Zip is required"
// 				value={uiState.city}
// 				placeholder="Town or City..."
// 				onChange={(e) => {
// 					uiState.city = e.target.value;
// 				}}
// 			/>
// 			<TextField
// 				variant="outlined"
// 				style={{
// 					width:'80%',
// 					marginBottom:'.5em',
// 				}}
// 				helperText="City or Zip is required"
// 				value={uiState.zip}
// 				placeholder="ZIP Code..."
// 				onChange={(e) => {
// 					uiState.zip = e.target.value;
// 				}}
// 			/>
// 			<br/>
// 			<Button
// 				onClick={async () => {
// 					uiState.results = await arcgisGeocode(uiState.street, uiState.city, uiState.zip);
// 				}}
// 				disabled={!uiState.street || (!uiState.city && !uiState.zip)}
// 				variant="contained"
// 			>
// 				<Search /> Search
// 			</Button>
// 		</Grid>
// 	)
// });


// const ResultsComponent: FunctionComponent<{uiState: MeasureToolComponentState}> = observer(({uiState}) => {
// 	const mapService = useService(MapService);
// 	return (
// 		<>
// 			<Grid
// 				container
// 				style={{
// 					height: '85%',
// 					padding: '0 2em',
// 				}}
// 			>
// 				<Grid
// 					container
// 					direction="row"
// 					style={{
// 						marginBottom: '1em'
// 					}}
// 				>
// 					{uiState.results.map((r) => {
// 						return (
// 							<Grid
// 								item
// 								style={{
// 									height: '1.4em'
// 								}}
// 								key={Math.random()}
// 							>
// 								<Button
// 									onClick={async () => {
// 										const spMeters = "+proj=lcc +lat_1=42.68333333333333 +lat_2=41.71666666666667 +lat_0=41 +lon_0=-71.5 +x_0=200000 +y_0=750000 +ellps=GRS80 +datum=NAD83 +units=m +no_defs";
// 										const spFeet = "+proj=lcc +lat_1=42.68333333333333 +lat_2=41.71666666666667 +lat_0=41 +lon_0=-71.5 +x_0=200000.0001016002 +y_0=750000 +ellps=GRS80 +datum=NAD83 +to_meter=0.3048006096012192 +no_defs"
// 										const pt = proj4(spMeters).inverse([Math.round(r.location.x), Math.round(r.location.y)]);
// 										const center = latLng(pt[1], pt[0]);
// 										mapService.leafletMap?.setZoom(19);
// 										// have to give it time to get to the right zoom, I guess
// 										window.setTimeout(() => {
// 											mapService.leafletMap?.panTo(center);
// 											uiState.isOpen = false;
// 										}, 500)
// 									}}
// 									variant="contained"
// 								>
// 									<Explore />
// 								</Button>
// 								&nbsp;&nbsp;
// 								{r.address}
// 							</Grid>
// 						)
// 					})}
// 				</Grid>
// 				{/* <Grid item>
// 					<Button
// 						onClick={async () => {
// 							uiState.results = [];
// 						}}
// 						variant="contained"
// 					>
// 						<ArrowBack /> Back
// 					</Button>
// 				</Grid> */}
// 			</Grid>
// 		</>
// 	)
// });

export { MeasureToolComponent }