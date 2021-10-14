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

import { ArrowForward } from '@material-ui/icons';
import { ConfigService } from '../services/ConfigService';

import "typeface-noto-sans-tc";

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
	const [ legendService, configService ] = useService([ LegendService, ConfigService ]);

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
						<img
							style={{
								height: configService.splashImageHeight
							}}
							src={configService.splashImage}
						/>
						<p dangerouslySetInnerHTML={{
							__html: legendService.splashPageContent
						}}></p>
					</Grid>
					<Grid item xs={12} style={{
						textAlign: 'center'
					}}>
						<Button
							variant="contained"
							style={{
								"color": "#fff",
								"backgroundColor": "#14558f"
							}}
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
						<br/><br/>
						<a href="license.txt" target="_blank">license information</a>
					</Grid>
				</Grid>
			</div>
		</Modal>
	);
});

export default withRouter(SplashPageModal);