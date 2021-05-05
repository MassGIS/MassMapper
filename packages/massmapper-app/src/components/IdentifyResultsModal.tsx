import {
	Grid,
	Modal,
	Button
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { observer, Observer } from 'mobx-react';
import React, { FunctionComponent } from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import { useService } from '../services/useService';
import 'leaflet/dist/leaflet.css';

import { Close } from '@material-ui/icons';
import { SelectionService } from '../services/SelectionService';

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

interface IdentifyResultsModalProps extends RouteComponentProps<any> {
}

const IdentifyResultsModal: FunctionComponent<IdentifyResultsModalProps> = observer(() => {

	const classes = useStyles();
	const [ selectionService ] = useService([ SelectionService]);

	return (
		<Modal
			open={selectionService.identifyResults.length > 0}
			onClose={() => {
				selectionService.clearIdentifyResults()
			}}
		>
			<div className={classes.paper}>
				<Grid
					className={classes.container}
					style={{
						height: '100%'
					}}>
					<Grid item xs={12} style={{
						height: '90%',
						textAlign: 'center'
					}}>
						<span>IDENTIFY RESULTS GO HERE</span>
						{selectionService.identifyResults.map((result) => (
							<Observer>{
								() => (<div key={result.layer.id}>{result.layer.title} - {result.numFeaturesDisplay}</div>)
							}</Observer>
						))}
					</Grid>
					<Grid item xs={12} style={{
						textAlign: 'center'
					}}>
						<Button
							variant="contained"
							onClick={() => {
								selectionService.clearIdentifyResults()
							}}
						>
							<Close /> CLOSE RESULTS
						</Button>
					</Grid>
				</Grid>
			</div>
		</Modal>
	);
});

export default withRouter(IdentifyResultsModal);