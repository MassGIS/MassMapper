import {
	Grid,
	Button,
	Dialog,
	DialogTitle,
	TableContainer,
	Table,
	TableHead,
	TableRow,
	TableCell
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { observer, Observer } from 'mobx-react';
import { useLocalObservable } from 'mobx-react-lite';
import React, { FunctionComponent } from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import { useService } from '../services/useService';
import 'leaflet/dist/leaflet.css';

import { Close } from '@material-ui/icons';
import { SelectionService } from '../services/SelectionService';
import { IdentifyResult } from '../models/IdentifyResults';

const useStyles = makeStyles((theme) => ({
		appBarSpacer: theme.mixins.toolbar,
		container: {
			flexGrow: 1,
			height: '60vh',
			width: '600px'
		},
		table: {
			minWidth: '100%',
		},
	}));

interface IdentifyResultsModalProps extends RouteComponentProps<any> {
}

interface IdentifyResultModalState {
	selectedIdentifyResult?: IdentifyResult;
}

const IdentifyResultsModal: FunctionComponent<IdentifyResultsModalProps> = observer(() => {

	const classes = useStyles();
	const [ selectionService ] = useService([ SelectionService]);
	const myState = useLocalObservable<IdentifyResultModalState>(() => {
		return {
			selectedIdentifyResult: undefined,
		}
	});

	return (
		<Dialog
			open={selectionService.identifyResults.length > 0}
			onClose={() => {
				selectionService.clearIdentifyResults()
				myState.selectedIdentifyResult = undefined;
			}}
		>
			<DialogTitle id="identify-dialog-title">Identify Results</DialogTitle>
			<Grid
				className={classes.container}
			>
				<Grid item xs={12} style={{
					height: '45%'
				}}>
					<TableContainer>
						<Table
							className={classes.table}
							aria-labelledby="identify-results-counts"
							size="small" // "medium"
							aria-label="enhanced table"
						>
							<TableHead>
								<TableRow>
									<TableCell padding="default"></TableCell>
									<TableCell padding="default">Data Layer Name</TableCell>
									<TableCell padding="default">Feature(s) Found?</TableCell>
								</TableRow>
							</TableHead>
						{selectionService.identifyResults.map((result) => (
							<Observer>{() => (
								<TableRow
									hover
									selected={result.layer.id === myState.selectedIdentifyResult?.layer.id}
									onClick={(e) => {
										myState.selectedIdentifyResult = result
									}}
								>
									<TableCell>{result.layer.layerType}</TableCell>
									<TableCell>{result.layer.title}</TableCell>
									<TableCell>{result.numFeaturesDisplay}</TableCell>
								</TableRow>
							)}</Observer>
						))}
						</Table>
					</TableContainer>
				</Grid>
				<Grid item xs={12} style={{
					height: '45%'
				}}>
					{myState.selectedIdentifyResult && (
						<span>
							{myState.selectedIdentifyResult.layer.title} Results:
						</span>
					)}
				</Grid>
				<Grid item xs={12} style={{
					textAlign: 'center'
				}}>
					<Button
						variant="contained"
						onClick={() => {
							selectionService.clearIdentifyResults()
							myState.selectedIdentifyResultId = undefined;
						}}
					>
						<Close /> Back to Map
					</Button>
				</Grid>
			</Grid>
		</Dialog>
	);
});

export default withRouter(IdentifyResultsModal);