import {
	Grid,
	Button,
	Dialog,
	DialogTitle,
	DialogContent,
	LinearProgress,
	Menu,
	MenuItem,
	Paper,
	PaperProps,
	TableContainer,
	Table,
	TableHead,
	TableBody,
	TableRow,
	TableCell,
	Tooltip,
} from '@material-ui/core';
import { DataGrid, GridSelectionModelChangeParams } from '@material-ui/data-grid';
import { makeStyles } from '@material-ui/core/styles';
import { observer, Observer } from 'mobx-react';
import { useLocalObservable } from 'mobx-react-lite';
import React, { FunctionComponent, MouseEvent } from 'react';
import Draggable from 'react-draggable';
import { RouteComponentProps, withRouter } from 'react-router';
import { useService } from '../services/useService';

import { Close, Save, SaveAlt, AspectRatio, PhotoSizeSelectSmall } from '@material-ui/icons';
import { SelectionService } from '../services/SelectionService';

const selectedColor = '#eee';
const hoverColor = '#ccc';

const useStyles = makeStyles((theme) => ({
		appBarSpacer: theme.mixins.toolbar,
		container: {
			flexGrow: 1,
			height: '80vh',
		},
		table: {
			width: '90vh',
			'& .MuiTableBody-root .MuiTableRow-root:hover': {
				backgroundColor: hoverColor,
			},
			'& .MuiTableBody-root .MuiTableRow-root.Mui-selected:hover': {
				backgroundColor: hoverColor,
			},
			'& .MuiTableBody-root .MuiTableRow-root.Mui-selected': {
				backgroundColor: selectedColor,
			},
		}
	}));

const useStylesDataGrid = makeStyles({
	root: {
		'& .MuiDataGrid-colCell': {
			padding: '0 .5em',
		},
		'& .MuiDataGrid-row.Mui-selected': {
			backgroundColor: selectedColor,
		},
		'& .MuiDataGrid-row:hover': {
			backgroundColor: hoverColor,
		},
		'& .MuiDataGrid-row.Mui-selected:hover': {
			backgroundColor: hoverColor,
		}
	},
	columnHeader: {
		height: '40px',
	}
});


interface IdentifyResultsModalProps extends RouteComponentProps<any> {
}

interface IdentifyResultModalState {
	isExporting: boolean;
	isDisplayingExportResults: boolean;
	exportResultsUrl?: string;
	windowSize: "xl" | "xs";
}

const PaperComponent: FunctionComponent<PaperProps> = (props: PaperProps) => {
	return (
		<Draggable handle="#identify-dialog-title" cancel={'[class*="MuiDialogContent-root"]'}>
			<Paper {...props} />
		</Draggable>
	);
}


const IdentifyResultsModal: FunctionComponent<IdentifyResultsModalProps> = observer(() => {

	const classes = useStyles();
	const dataGridClasses = useStylesDataGrid();

	const [ selectionService ] = useService([ SelectionService]);
	const myState = useLocalObservable<IdentifyResultModalState>(() => {
		return {
			isExporting: false,
			isDisplayingExportResults: false,
			exportResultsUrl: undefined,
			windowSize: "xl"
		}
	});

	const [saveAllAnchorEl, setSaveAllAnchorEl] = React.useState<null | HTMLElement>(null);
	const [saveSelectedAnchorEl, setSaveSelectedAnchorEl] = React.useState<null | HTMLElement>(null);

	const columns = selectionService.selectedIdentifyResult?.properties.filter(p => p != 'bbox').map((p) => {
		return {
			field: p,
			headerName: p,
			width: 110,
			height: 20,
			resizable: true,
			renderCell: (params: any) => {
				const value = params.getValue(p);
				return (
					<Tooltip title={value} >
						<span className="table-cell-trucate">{value}</span>
					</Tooltip>
				);
			},
		};
	}) || [];

	return (
		<Dialog
			maxWidth={myState.windowSize}
			open={selectionService.identifyResults.length > 0}
			onClose={() => {
				selectionService.clearIdentifyResults()
				selectionService.selectedIdentifyResult = undefined;
			}}
			PaperComponent={PaperComponent}
		>
			<DialogTitle
				style={{
					cursor: "grabbing"
				}}
				id="identify-dialog-title"
			>
				Identify Results
				<div style={{float: 'right'}}>
					<Button
						onClick={() => {
							myState.windowSize = myState.windowSize === 'xl' ? 'xs':'xl'
						}}
					>
						{myState.windowSize === 'xl' && <PhotoSizeSelectSmall />}
						{myState.windowSize === 'xs' && <AspectRatio />}
					</Button>

				</div>
			</DialogTitle>
			{myState.isExporting && (
				<Dialog
					maxWidth="xl"
					open={myState.isExporting}
				>
					<DialogTitle id="export-dialog-title">Exporting Data</DialogTitle>
					<DialogContent>
						<LinearProgress />
					</DialogContent>
				</Dialog>
			)}

			{myState.isDisplayingExportResults && (
				<Dialog
					maxWidth="xl"
					open={myState.isDisplayingExportResults}
				>
					<DialogTitle id="export-dialog-title">Download Data</DialogTitle>
					<DialogContent
						style={{
							marginBottom: '1em'
						}}
					>
						<a target="_blank" href={myState.exportResultsUrl}>Click here</a> to download your export
					</DialogContent>
					<Button
						onClick={() => {
							myState.isExporting = false;
							myState.isDisplayingExportResults = false;
						}}
						variant="contained"
					>
						<Close /> Return to Data
					</Button>
				</Dialog>
			)}

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
										selected={result.layer.id === selectionService.selectedIdentifyResult?.layer.id}
										onClick={(e) => {
											selectionService.selectedIdentifyResult = result;
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
					{selectionService.selectedIdentifyResult && (
						<DataGrid
							hideFooterRowCount={myState.windowSize === 'xs'}
							hideFooterSelectedRowCount={myState.windowSize === 'xs'}
							checkboxSelection
							disableColumnFilter
							classes={{
								root: dataGridClasses.root
							}}
							columns={columns}
							headerHeight={35}
							onSelectionModelChange={(p:GridSelectionModelChangeParams) => {
								selectionService.selectedIdentifyResult?.clearSelected();
								p.selectionModel.forEach(fid => { selectionService.selectedIdentifyResult?.setSelected(fid as string, true) })
							}}
							rowHeight={35}
							rows={selectionService.selectedIdentifyResult.rows}
						/>
					)}
				</Grid>
				<Grid item xs={12} style={{
					height: '10%',
					marginTop: '1em'
				}}>
					{selectionService.selectedIdentifyResult && (
						<>
							<Button
								variant="contained"
								style={{
									marginLeft: '1em'
								}}
								onClick={async (event: MouseEvent<HTMLButtonElement>) => {
									setSaveAllAnchorEl(event.currentTarget);

								}}
							>
								<Save /> Save all features as...
							</Button>
							<Menu
								id="simple-menu"
								anchorEl={saveAllAnchorEl}
								keepMounted
								open={!!saveAllAnchorEl}
								onClose={() => {
									setSaveAllAnchorEl(null)
								}}
							>
								<MenuItem onClick={async () => {
									myState.isExporting = true;
									myState.exportResultsUrl = await selectionService.selectedIdentifyResult?.exportToUrl('xlsx', false);
									myState.isDisplayingExportResults = true;
									myState.isExporting = false;

									setSaveAllAnchorEl(null)
								}}>
									Excel 2007 (xlsx)
								</MenuItem>
								<MenuItem onClick={async () => {
									myState.isExporting = true;
									myState.exportResultsUrl = await selectionService.selectedIdentifyResult?.exportToUrl('csv', false);
									myState.isDisplayingExportResults = true;
									myState.isExporting = false;

									setSaveAllAnchorEl(null)
								}}>
									CSV (csv)
								</MenuItem>
							</Menu>
							<Button
								variant="contained"
								style={{
									marginLeft: '1em'
								}}
								disabled={selectionService.selectedIdentifyResult.rows.filter(t => t.isSelected).length === 0}
								onClick={(event: MouseEvent<HTMLButtonElement>) => {
									setSaveSelectedAnchorEl(event.currentTarget);
								}}
							>
								<SaveAlt /> Save selected features as...
							</Button>
							<Menu
								id="simple-menu"
								anchorEl={saveSelectedAnchorEl}
								keepMounted
								open={!!saveSelectedAnchorEl}
								onClose={() => {
									setSaveSelectedAnchorEl(null)
								}}
							>
								<MenuItem onClick={async () => {
									myState.isExporting = true;
									myState.exportResultsUrl = await selectionService.selectedIdentifyResult?.exportToUrl('xlsx', true);
									myState.isDisplayingExportResults = true;
									myState.isExporting = false;

									setSaveSelectedAnchorEl(null)
								}}>
									Excel 2007 (xlsx)
								</MenuItem>
								<MenuItem onClick={async () => {
									myState.isExporting = true;
									myState.exportResultsUrl = await selectionService.selectedIdentifyResult?.exportToUrl('csv', true);
									myState.isDisplayingExportResults = true;
									myState.isExporting = false;

									setSaveSelectedAnchorEl(null)
								}}>
									CSV (csv)
								</MenuItem>
							</Menu>
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
							selectionService.selectedIdentifyResult = undefined;
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