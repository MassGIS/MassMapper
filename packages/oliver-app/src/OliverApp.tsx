import { observer } from 'mobx-react';
import React, { FunctionComponent, useContext } from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import { useService } from './services/useService';
import { ServiceContext } from './services/ServiceContext';
import { LegendService, Layer } from './services/LegendService';

import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';

import './OliverApp.module.css';
import 'leaflet/dist/leaflet.css';

import { makeStyles } from '@material-ui/core/styles';
import Checkbox from '@material-ui/core/Checkbox';
import FormGroup from '@material-ui/core/FormGroup';
import FormLabel from '@material-ui/core/FormLabel';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';

import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import { LatLngExpression, Map } from 'leaflet';
import { MapService } from './services/MapService';

const useStyles = makeStyles((theme) => ({
	root: {
		display: 'flex',
	},
	formControl: {
		margin: theme.spacing(3),
	},
	table: {
		minWidth: 650,
	},
}));

interface OliverAppProps extends RouteComponentProps<any> {}
const OliverApp: FunctionComponent<OliverAppProps> = observer(() => {

	const { services } = useContext(ServiceContext);
	const classes = useStyles();

	if (!services.has(LegendService)) {
		const ls = new LegendService();
		loadSomeLayers(ls);
		services.set(LegendService, ls);

		const ms = new MapService(ls);
		services.set(MapService, ms);
	}

	const legendService = useService(LegendService);
	window['legendService'] = legendService;

	const mapService = useService(MapService);
	window['mapService'] = mapService;

	if (!legendService.ready) {
		return (<>Loading...</>);
	}

	const position = [51.505, -0.09] as LatLngExpression;

	debugger;

	return (
		<div styleName="container">
			<div styleName="nav">
				Nav Bar
			</div>
			<div styleName="right" className={classes.root}>
				<FormControl component="fieldset" className={classes.formControl}>
					<FormLabel component="legend">Available layers</FormLabel>
					<FormGroup>
						{legendService.layers.map((l) => (
							<FormControlLabel
								key={`layer-${l.id}`}
								control={
									<Checkbox
										onChange={(e) => {
											l.enabled = e.target.checked;
										}}
										checked={l.enabled}
										color="default"
									/>}
								label={l.name}
							/>
						))}
					</FormGroup>
				</FormControl>
			</div>
			<div styleName="main">
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
					zoom={13}
					scrollWheelZoom={true}
					style={{
						height: "100%"
					}}
					whenCreated={(map:Map) => {
						mapService.initLeafletMap(map);
					}}
				>
				</MapContainer>
			</div>
		</div>
	);
});

const loadSomeLayers = (legendService: LegendService) => {
	[{
		name: "test",
		id: "test-id",
		enabled: true,
	},
	{
		name: "another test",
		id: "test-2",
		enabled: true,
	},
	{
		name: "layer 3",
		id: "test-3",
		enabled: true,
	},
	{
		name: "layer d",
		id: "test-4",
		enabled: true,
	}].forEach((l: Layer) => {
		legendService.addLayer(l);
	});
}


export default withRouter(OliverApp);