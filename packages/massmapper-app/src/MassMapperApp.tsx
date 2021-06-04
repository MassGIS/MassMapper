import {
	AppBar,
	Grid,
	Paper,
	Toolbar,
	Typography,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { LatLng, LatLngBoundsExpression, Map } from 'leaflet';
import { observer } from 'mobx-react';
import React, { FunctionComponent, useEffect } from 'react';
import { MapContainer } from 'react-leaflet';
import { RouteComponentProps, withRouter } from 'react-router';
import { LegendService } from './services/LegendService';
import { CatalogService } from './services/CatalogService';
import { MapService } from './services/MapService';
import { ToolService } from './services/ToolService';
import LegendComponent from './components/LegendComponent';
import CatalogComponent from './components/CatalogComponent';
import { useService } from './services/useService';

import 'leaflet/dist/leaflet.css';
import '../leaflet.css';

import SplashPageModal from './components/SplashPageModal';
import IdentifyResultsModal from './components/IdentifyResultsModal';
import ToolsOverlayComponent from './components/ToolsOverlayComponent';
import { HistoryService } from './services/HistoryService';
import { SelectionService } from './services/SelectionService';

const useStyles = makeStyles((theme) => ({
		appBarSpacer: theme.mixins.toolbar,
		container: {
			flexGrow: 1
		},
		content: {
			flexGrow: 1,
			height: '100%',
			overflow: 'auto'
		},
		formControl: {
			margin: theme.spacing(3)
		},
		map: {
			height: '100%'
		},
		mapContainer: {
			position: 'relative',
			flexGrow: 1
		},
		root: {
			display: 'flex',
			height: '100%'
		},
		table: {
			minWidth: 650
		},
		title: {
			flexGrow: 1
		},
		paper: {
			position: 'absolute',
			width: '80vw',
			height: '80vh',
			top: '10vh',
			left: '10vw',
			backgroundColor: theme.palette.background.paper,
			border: '2px solid #000',
			boxShadow: theme.shadows[5],
			padding: theme.spacing(2, 4, 3),
		}
	}));

interface MassMapperAppProps extends RouteComponentProps<any> {
}

const MassMapperApp: FunctionComponent<MassMapperAppProps> = observer(() => {

	const classes = useStyles();
	const [ legendService, mapService, catalogService, toolService, historyService ] = useService([ LegendService, MapService, CatalogService, ToolService, HistoryService]);
	const [ selectionService ] = useService([ SelectionService ]);

	if (!legendService.ready || !catalogService.ready || !toolService.ready) {
		return (<>Loading...</>);
	}

	window['mapService'] = mapService;
	window['selectionService'] = selectionService;

	const c = historyService.has('c') ?
		(historyService.get('c') as string).split(',').map(s => parseFloat(s)) :
		[42.067627975,-71.7182675];
	const center = new LatLng(c[0], c[1]);
	const zoom = parseInt(historyService.get('z') as string || '8');

	return (
		<div className={classes.root}>
			{/* <AppBar position="absolute">
				<Toolbar>
					<img src={massmapper} style={{
						height: 54
					}} />
					<Typography className={classes.title} color="inherit" component="h1" noWrap variant="h6">
						&nbsp;&nbsp;MassGIS's Online Mapping Tool
					</Typography>
				</Toolbar>
			</AppBar> */}
			<Grid className={classes.content} component="main" container direction="column">
				<SplashPageModal />
				<IdentifyResultsModal />
				<Grid className={classes.container} container item wrap="nowrap">
					<Grid className={classes.mapContainer} item>
						<ToolsOverlayComponent />
						<MapContainer
							center={center}
							zoom={zoom}
							className={classes.map}
							scrollWheelZoom={true}
							whenCreated={(map: Map) => {
								mapService.initLeafletMap(map);
							}}
						/>
					</Grid>
					<Grid style={{maxHeight: '100vh'}} component={Paper} item square xs={3}>
						<Grid container style={{height: '100%'}} direction="column">
							<Grid item style={{minHeight: '60%', maxHeight: '60%', maxWidth: '100%', overflowY: 'scroll', border: "1px solid lightgray"}}>
								<CatalogComponent />
							</Grid>
							<Grid item style={{minHeight: '40%', maxHeight: '40%', maxWidth: '100%', overflowY: 'scroll', overflowX: 'hidden'}}>
								<LegendComponent />
							</Grid>
						</Grid>
					</Grid>
				</Grid>
			</Grid>
		</div>
	);
});

export default withRouter(MassMapperApp);