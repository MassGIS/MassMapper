import {
	AppBar,
	Checkbox,
	FormControl,
	FormControlLabel,
	FormGroup,
	FormLabel,
	Grid,
	Paper,
	Toolbar,
	Typography
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { LatLngExpression, Map } from 'leaflet';
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

	const position = [ 51.505, -0.09 ] as LatLngExpression;

	return (
		<div className={classes.root}>
			<AppBar position="absolute">
				<Toolbar>
					<Typography className={classes.title} color="inherit" component="h1" noWrap variant="h6">
						Nav Bar
					</Typography>
				</Toolbar>
			</AppBar>
			<Grid className={classes.content} component="main" container direction="column">
				<Grid className={classes.appBarSpacer} item/>
				<Grid className={classes.container} container item wrap="nowrap">
					<Grid className={classes.mapContainer} item>
						{/* <TableContainer component={Paper}>
							<Table className={classes.table} aria-label="Active Layers">
								<TableHead>
									<TableRow>
										<TableCell>Active Layers</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{legendService.enabledLayers.map((l) => (
										<TableRow key={`layer-${l.id}`}>
											<TableCell component="th" scope="row">
												{l.name}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableContainer> */}
						<MapContainer
							center={position}
							className={classes.map}
							scrollWheelZoom={true}
							whenCreated={(map: Map) => {
								mapService.initLeafletMap(map);
							}}
							zoom={13}
						/>
					</Grid>
					<Grid component={Paper} item square xs={3}>
						<FormControl className={classes.formControl} component="fieldset">
							<FormLabel component="legend">Available layers</FormLabel>
							<FormGroup>
								{legendService.layers.map((l) => (
									<FormControlLabel
										control={
											<Checkbox
												onChange={(e) => {
													l.enabled = e.target.checked;
												}}
												checked={l.enabled}
												color="default"
											/>}
										key={`layer-${l.id}`}
										label={l.name}
									/>
								))}
							</FormGroup>
						</FormControl>
					</Grid>
				</Grid>
			</Grid>
		</div>
	);
});

export default withRouter(OliverApp);