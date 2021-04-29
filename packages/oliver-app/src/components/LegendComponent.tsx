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
	CircularProgress,
	Button,
	IconButton
} from '@material-ui/core';
import {
	DeleteOutline,
	ErrorOutline
} from '@material-ui/icons';
import { makeStyles } from '@material-ui/core/styles';
import { LatLngBoundsExpression, Map } from 'leaflet';
import { observer } from 'mobx-react';
import React, { FunctionComponent } from 'react';
import { MapContainer } from 'react-leaflet';
import { RouteComponentProps, withRouter } from 'react-router';
import { LegendService } from '../services/LegendService';
import { useService } from '../services/useService';
import 'leaflet/dist/leaflet.css';
import { ClassNameMap } from '@material-ui/styles';

interface LegendComponentProps extends RouteComponentProps<any> {
}

const useStyles = makeStyles((theme) => ({
	formControl: {
		margin: theme.spacing(3)
	},
	button: {
		padding: '0',
	}
}));

const LegendComponent: FunctionComponent<LegendComponentProps> = observer(({}) => {

	const [ legendService ] = useService([ LegendService ]);
	const classes = useStyles();

	return (
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
					let image = <span/>;
					if (l.enabled) {
						if (l.scaleOk) {
							status = l.isLoading ? <CircularProgress size="20px"/> : status;
							image = l.legendURL ? (
								<img
									src={l.legendURL}
									className='img-fluid'
									alt={l.name}
									style={{maxWidth: 200}}
								/>
							) : image;
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
								<div style={{display: 'table-cell', width: 55}}>
									<Tooltip
										title="enable/disable layer"
									>
										<Checkbox
											className={classes.button}
											onChange={(e) => {
												l.enabled = e.target.checked;
											}}
											checked={l.enabled}
											color="default"
										/>
									</Tooltip>
									<Tooltip
										title="remove layer"
									>
										<IconButton
											className={classes.button}
											onClick={() => {
												legendService.removeLayer(l);
											}}
										>
											<DeleteOutline />
										</IconButton>
									</Tooltip>
								</div>
							}
							key={`layer-${l.id}`}
							label={
								<div style={{whiteSpace: 'nowrap' }}>
									{l.title}&nbsp;&nbsp;{status}<br/>
									{image}
								</div>
							}
						/>
					)
				})}

			</FormGroup>
		</FormControl>
	);
});

export default withRouter(LegendComponent);