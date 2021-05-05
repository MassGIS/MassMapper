import {
	AppBar,
	Grid,
	Paper,
	Toolbar,
	Typography,
	Modal,
	Button
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { LatLngBoundsExpression, Map } from 'leaflet';
import { observer } from 'mobx-react';
import React, { FunctionComponent } from 'react';
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

import { Close } from '@material-ui/icons';
import massmapper from './images/massmapper.png';
import SplashPageModal from './components/SplashPageModal';
import IdentifyResultsModal from './components/IdentifyResultsModal';

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
	const [ legendService, mapService, catalogService, toolService ] = useService([ LegendService, MapService, CatalogService, ToolService]);

	if (!legendService.ready || !catalogService.ready) {
		return (<>Loading...</>);
	}

	const bbox = [
		[41.237964, -73.508142],
		[42.886589, -69.928393]
	] as LatLngBoundsExpression;

	return (
		<div className={classes.root}>
			<AppBar position="absolute">
				<Toolbar>
					<img src={massmapper} style={{
						height: 54
					}} />
					<Typography className={classes.title} color="inherit" component="h1" noWrap variant="h6">
						&nbsp;&nbsp;MassGIS's Online Mapping Tool
					</Typography>
				</Toolbar>
			</AppBar>
			<Grid style={{paddingTop: 65}} className={classes.content} component="main" container direction="column">
				<SplashPageModal />
				<IdentifyResultsModal />
				<Grid className={classes.container} container item wrap="nowrap">
					<Grid className={classes.mapContainer} item>
						<MapContainer
							bounds={bbox}
							className={classes.map}
							scrollWheelZoom={true}
							whenCreated={(map: Map) => {
								mapService.initLeafletMap(map);
							}}
						/>
					</Grid>
					<Grid style={{maxHeight: 'calc(100vh - 65px)'}} component={Paper} item square xs={3}>
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