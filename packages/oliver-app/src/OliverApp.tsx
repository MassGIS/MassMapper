import {
	AppBar,
	Checkbox,
	FormControl,
	FormControlLabel,
	FormGroup,
	Grid,
	Paper,
	Toolbar,
	Typography,
	Tooltip,
	CircularProgress
} from '@material-ui/core';
import {
	ErrorOutline
} from '@material-ui/icons';
import { makeStyles } from '@material-ui/core/styles';
import { LatLngBoundsExpression, Map } from 'leaflet';
import { observer } from 'mobx-react';
import React, { FunctionComponent } from 'react';
import { MapContainer } from 'react-leaflet';
import { RouteComponentProps, withRouter } from 'react-router';
import { LegendService } from './services/LegendService';
import { MapService } from './services/MapService';
import { useService } from './services/useService';
import 'leaflet/dist/leaflet.css';

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
		}
	}));

interface OliverAppProps extends RouteComponentProps<any> {
}

const OliverApp: FunctionComponent<OliverAppProps> = observer(() => {

	const classes = useStyles();
	const [ legendService, mapService ] = useService([ LegendService, MapService ]);
	window['legendService'] = legendService;
	window['mapService'] = mapService;

	if (!legendService.ready) {
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
					<img src="http://maps.massgis.state.ma.us/map_ol/img/oliver_small.png" />
					<Typography className={classes.title} color="inherit" component="h1" noWrap variant="h6">
						&nbsp;&nbsp;MassMapper: MassGIS's Online Mapping Tool
					</Typography>
				</Toolbar>
			</AppBar>
			<Grid style={{paddingTop: 65}} className={classes.content} component="main" container direction="column">
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
					<Grid style={{maxHeight: 'calc(100vh - 65px)', overflow: 'auto'}} component={Paper} item square xs={3}>
						<FormControl className={classes.formControl} component="fieldset">
							<FormGroup>
								{legendService.layers.map((l) => {
									// Don't show a legend image if we have none.
									const img = l.legendURL ? (
										<img
											src={l.legendURL}
											className='img-fluid'
											alt={l.name}
										/>
									) : '';

									let status = <span/>;
									if (l.enabled) {
										if (l.scaleOk) {
											status = l.isLoading ? <CircularProgress size="20px"/> : status;
										}
										else {
											status = 
												<Tooltip title="Out of scale">
													<ErrorOutline fontSize="small"/>
												</Tooltip>;
										}
									}

									return (
										<FormControlLabel
											style={{display: 'table'}}
											control={
												<div style={{display: 'table-cell', width: 42}}>
													<Checkbox
														onChange={(e) => {
															l.enabled = e.target.checked;
														}}
														checked={l.enabled}
														color="default"
													/>
												</div>
											}
											key={`layer-${l.id}`}
											label={
												<div>
													{l.name}&nbsp;&nbsp;{status}<br/>
													{img}
												</div>
											}
										/>
									)
								})}

							</FormGroup>
						</FormControl>
					</Grid>
				</Grid>
			</Grid>
		</div>
	);
});

export default withRouter(OliverApp);