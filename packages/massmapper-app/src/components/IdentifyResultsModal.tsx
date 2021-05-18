import {
	Grid,
	Button,
	Dialog,
	DialogTitle,
	TableContainer,
	Table,
	TableHead,
	TableBody,
	TableRow,
	TableCell
} from '@material-ui/core';
import { DataGrid, GridSortDirection, GridColDef } from '@material-ui/data-grid';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import { observer, Observer } from 'mobx-react';
import { useLocalObservable } from 'mobx-react-lite';
import React, { FunctionComponent } from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import { useService } from '../services/useService';
import 'leaflet/dist/leaflet.css';

import { Close, Save, SaveAlt } from '@material-ui/icons';
import { SelectionService } from '../services/SelectionService';
import { IdentifyResult } from '../models/IdentifyResults';

const useStyles = makeStyles((theme) => ({
		appBarSpacer: theme.mixins.toolbar,
		container: {
			flexGrow: 1,
			height: '80vh',
		},
		table: {
			width: '90vh',
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

	const columns = myState.selectedIdentifyResult?.properties.map((p) => {
		return {
			field: p,
			headerName: p,
			width: 110,
		};
	}) || [];

	return (
		<Dialog
			maxWidth="xl"
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
					height: '35%'
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
							<TableBody>
							{selectionService.identifyResults.map((result) => (
								<Observer>{() => (
									<TableRow
										hover
										selected={result.layer.id === myState.selectedIdentifyResult?.layer.id}
										onClick={(e) => {
											myState.selectedIdentifyResult = result;
											result.getResults();
										}}
										key={result.layer.id}
									>
										<TableCell>{result.layer.layerType}</TableCell>
										<TableCell>{result.layer.title}</TableCell>
										<TableCell>{result.numFeaturesDisplay}</TableCell>
									</TableRow>
								)}</Observer>
							))}
							</TableBody>
						</Table>
					</TableContainer>
				</Grid>
				<Grid item xs={12} style={{
					height: '45%'
				}}>
					{myState.selectedIdentifyResult && (
						<DataGrid
							columns={columns}
							rows={myState.selectedIdentifyResult.rows}
						/>
					)}
				</Grid>
				<Grid item xs={12} style={{
					height: '10%',
					marginTop: '1em'
				}}>
					{myState.selectedIdentifyResult && (
						<>
							<Button
								variant="contained"
								style={{
									marginLeft: '1em'
								}}
							>
								<Save /> Save all features as...
							</Button>
							<Button
								variant="contained"
								style={{
									marginLeft: '1em'
								}}
							>
								<SaveAlt /> Save selected features as...
							</Button>
						</>
					)}
				</Grid>
				<Grid item xs={12} style={{
					textAlign: 'center',
					marginTop: '1em'
				}}>
					<Button
						variant="contained"
						onClick={() => {
							selectionService.clearIdentifyResults()
							myState.selectedIdentifyResult = undefined;
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