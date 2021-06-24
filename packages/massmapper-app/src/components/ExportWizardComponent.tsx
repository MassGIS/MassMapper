import {
	Box,
	Grid,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	LinearProgress,
	Menu,
	MenuItem,
	TableContainer,
	Table,
	TableHead,
	TableBody,
	TableRow,
	TableCell,
	Tooltip,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import {
	Close,
	Delete,
	GetApp,
	NavigateBefore,
	NavigateNext,
	Save,
	SaveAlt,
} from '@material-ui/icons';

import { observer, Observer } from 'mobx-react';
import { useLocalObservable } from 'mobx-react-lite';

import React, { FunctionComponent, MouseEvent } from 'react';

import { useService } from '../services/useService';
import { SelectionService } from '../services/SelectionService';
import { LegendService } from '../services/LegendService';
import { ConfigService } from '../services/ConfigService';
import { ToolComponentProps } from '../models/Tool';
import { Layer } from '../models/Layer';
import { CatalogService } from '../services/CatalogService';
import { MakeToolButtonComponent } from './MakeToolButtonComponent';

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


	// const PaperComponent: FunctionComponent<PaperProps> = (props: PaperProps) => {
		// 	return (
			// 		<Draggable handle="#identify-dialog-title" cancel={'[class*="MuiDialogContent-root"]'}>
			// 			<Paper {...props} />
			// 		</Draggable>
			// 	);
			// }

const HowtoComponent: FunctionComponent = () => (
	<Box
		style={{
			margin: '2em'
		}}
	>
		<b>Welcome to the data export wizard</b>
		<div>
		This wizard may be used to download geospatial data as shapefiles, Google Earth files (KMLs), or GeoTIFFs. Users
		may choose their area of interest and subsets of data layers may be downloaded. Metadata and other supporting documents
		are also packaged with the exported data.
		</div>
		<div>
		A 15 MB size limit has been imposed on each raster data layer, and a 25,000 feature limit has
		beenimposed on each vector data layer.

		</div>
	</Box>
)
// For information on accessing full datasets, please check the Help document

interface ExportWizardComponentState {
	activeStep: number | undefined;
	exportFileUrl?: string;
	exportLayers: Layer[];
	isExporting: boolean;
}

const ExportWizardComponent: FunctionComponent<ToolComponentProps> = observer(({tool}) => {

	const classes = useStyles();

	const [ legendService, selectionService, configService, catalogService ] = useService([ LegendService, SelectionService, ConfigService, CatalogService ]);
	const myState = useLocalObservable<ExportWizardComponentState>(() => {
		return {
			activeStep : undefined,
			exportLayers: legendService.enabledLayers,
			exportResultsUrl: undefined,
			isExporting: false
		}
	});

	const ExportButton = MakeToolButtonComponent(GetApp, 'Export data layers', () => {
		myState.activeStep = 1;
	});

	return (
		<>
			<ExportButton tool={tool} />
			<Dialog
				open={!!myState.activeStep}
				maxWidth='lg'
				onClose={() => {
					myState.activeStep = undefined;
				}}
				// PaperComponent={PaperComponent}
			>
				<DialogActions>
					<Button
						size="small"
						style={{
							float: 'right'
						}}
						onClick={() => {
							myState.activeStep = undefined;
						}}
					>
						<Close />
					</Button>
				</DialogActions>

				<DialogTitle>
					Export Wizard - &nbsp;&nbsp;
					Step {myState.activeStep}/4
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

				{myState.activeStep === 1 && (
					<HowtoComponent />
				)}

				{myState.activeStep === 2 && (
					<Grid
						className={classes.container}
						container
						direction="column"
					>
						<Grid item xs={6}>
							<TableContainer>
								<Table
									className={classes.table}
									size="small" // "medium"
									aria-label="enhanced table"
								>
									<TableHead>
										<TableRow>
											<TableCell padding="default"></TableCell>
											<TableCell padding="default">Data Layer Name</TableCell>
											<TableCell padding="default"></TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
									{myState.exportLayers.map((layer) => (
										<TableRow
											hover
											key={layer.id}
										>
											<TableCell>{layer.queryName ? 'polygon' : layer.layerType}</TableCell>
											<TableCell>{layer.title}</TableCell>
											<TableCell>
												<Button
													onClick={() => {
														alert("remove layer " + layer.title);
													}}
												>
													<Delete />
												</Button>
											</TableCell>
										</TableRow>
									))}
									</TableBody>
								</Table>
							</TableContainer>
						</Grid>

						<Grid item xs={6}>
							<TableContainer>
								<Table
									className={classes.table}
									size="small" // "medium"
									aria-label="enhanced table"
								>
									<TableHead>
										<TableRow>
											<TableCell padding="default"></TableCell>
											<TableCell padding="default">Data Layer Name</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
									{catalogService.uniqueLayers.map((layer) => (
										<TableRow
											hover
											key={layer.id}
										>
											<TableCell>{layer.queryName ? 'polygon' : layer.layerType}</TableCell>
											<TableCell>{layer.title}</TableCell>
										</TableRow>
									))}
									</TableBody>
								</Table>
							</TableContainer>
						</Grid>
					</Grid>
				)}

				<DialogActions>
					{myState.activeStep !== 1 && (
						<Button
							size="small"
							style={{
								float: 'right'
							}}
							onClick={() => {
								myState.activeStep = myState.activeStep! - 1;
							}}
						>
							<NavigateBefore /> Prev
						</Button>
					)}
					<Button
						size="small"
						style={{
							float: 'right'
						}}
						onClick={() => {
							myState.activeStep = myState.activeStep! + 1;
						}}
					>
						Next <NavigateNext />
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
});

export default ExportWizardComponent;