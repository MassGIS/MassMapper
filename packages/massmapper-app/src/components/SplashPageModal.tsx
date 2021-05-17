import {
	Grid,
	Modal,
	Button,
	Checkbox,
	FormControlLabel
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { observer } from 'mobx-react';
import React, { FunctionComponent } from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import { LegendService } from '../services/LegendService';
import { useService } from '../services/useService';
import 'leaflet/dist/leaflet.css';

import { Close, SkipNext, ArrowForward } from '@material-ui/icons';
import massmapper from '../images/massmapper.png';

const useStyles = makeStyles((theme) => ({
		appBarSpacer: theme.mixins.toolbar,
		container: {
			flexGrow: 1
		},
		// content: {
		// 	flexGrow: 1,
		// 	height: '100%',
		// 	overflow: 'auto'
		// },
		// formControl: {
		// 	margin: theme.spacing(3)
		// },
		// map: {
		// 	height: '100%'
		// },
		// mapContainer: {
		// 	flexGrow: 1
		// },
		// root: {
		// 	display: 'flex',
		// 	height: '100%'
		// },
		// table: {
		// 	minWidth: 650
		// },
		// title: {
		// 	flexGrow: 1
		// },
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

interface SplashPageModalProps extends RouteComponentProps<any> {
}

const SplashPageModal: FunctionComponent<SplashPageModalProps> = observer(() => {

	const classes = useStyles();
	const [ legendService ] = useService([ LegendService]);

	return (
		<Modal
			open={legendService.isSplashPageVisible}
			onClose={() => {
				legendService.isSplashPageVisible = false;
			}}
		>
			<div className={classes.paper}>
				<Grid
					className={classes.container}
					style={{
						height: '100%'
					}}>
					<Grid item xs={12} style={{
						height: '80%',
						textAlign: 'center'
					}}>
						<img src={massmapper} />
						<h2>Welcome to the new MassMapper</h2>
						<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus consectetur tempor urna, ac viverra neque cursus eget. Ut sed laoreet tortor. Phasellus sit amet orci lectus. Phasellus quis sapien ipsum. Ut eu vulputate dolor, eget faucibus erat. Morbi vestibulum leo id nunc laoreet sagittis. Donec dapibus pellentesque erat, sed maximus dolor hendrerit vitae. Nunc at ex eget ipsum vulputate imperdiet in id neque. Curabitur molestie mattis ornare. Vivamus pellentesque ipsum eu sagittis tincidunt. Phasellus vitae urna nec metus cursus porta.</p>
					</Grid>
					<Grid item xs={12} style={{
						textAlign: 'center'
					}}>
						<Button
							variant="contained"
							onClick={() => {
								legendService.isSplashPageVisible = false;
							}}
						>
							<ArrowForward /> &nbsp;&nbsp;Go to MassMapper
						</Button>
						<br/><br/>
						<FormControlLabel
							control={
								<Checkbox
								defaultChecked={false}
								onChange={() => {
									localStorage.setItem('massmapper.skipSplashPage', 'yes');
								}}
								name="noSplash" />
							}
							label="Don't show this splash page again, please"
						/>
					</Grid>
				</Grid>
			</div>
		</Modal>
	);
});

export default withRouter(SplashPageModal);