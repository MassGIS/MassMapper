import { IdentifyResult } from '../models/IdentifyResults';
import {
	Box,
	Grid,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	LinearProgress,
	TableContainer,
	Table,
	TableHead,
	TableBody,
	TableRow,
	TableCell,
	FormControlLabel,
	Radio,
	RadioGroup,
	Typography,
	TextField,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import {
	Add,
	Check,
	Close,
	Delete,
	Error,
	GetApp,
	NavigateBefore,
	NavigateNext,
} from '@material-ui/icons';

import { runInAction } from 'mobx';
import { observer } from 'mobx-react';
import { useLocalObservable } from 'mobx-react-lite';

import React, { FunctionComponent } from 'react';

import { useService } from '../services/useService';
import { LegendService } from '../services/LegendService';
import { ConfigService } from '../services/ConfigService';
import { ToolComponentProps } from '../models/Tool';
import { Layer } from '../models/Layer';
import { CatalogService } from '../services/CatalogService';
import { MakeToolButtonComponent } from './MakeToolButtonComponent';
import { MapService } from '../services/MapService';
import { LatLngBounds } from 'leaflet';

const selectedColor = '#eee';
const hoverColor = '#ccc';

const MAX_EXPORT_FEATURES = 25000;

const useStyles = makeStyles((theme) => ({
		appBarSpacer: theme.mixins.toolbar,
		container: {
			flexGrow: 1,
			height: '70vh'
			// ,width: '60vw'
		},
		table: {
			// width: '90vh',
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
	exportLayers: Map<string,Layer>;
	exportLayersFeatureCount: Map<string, number>;
	isExporting: boolean;
	isReadyForNextStep: boolean;
}

const calculateNumFeatures = (state:ExportWizardComponentState, bbox: LatLngBounds, gsurl: string):boolean => {
	runInAction(() => {
		state.exportLayersFeatureCount.clear();
		state.isReadyForNextStep = false;
	});

	let canDoExport = true;
	const queries:any[] = [];
	Array.from(state.exportLayers).forEach(async ([name, layer]) => {
		const idResults = new IdentifyResult(
			layer,
			bbox,
			gsurl
		);

		const idResult = idResults.getNumFeatures();
		queries.push(idResult);
		const numFeatures = await idResult;
		runInAction(() => {
			state.exportLayersFeatureCount.set(layer.name, numFeatures);
		});
	});

	Promise.all(queries).then(() => {
		Array.from(state.exportLayersFeatureCount.keys()).forEach((key) => {
			if (state.exportLayersFeatureCount.get(key)! > MAX_EXPORT_FEATURES)
				canDoExport = false;
		})

		runInAction(() => {
			state.isReadyForNextStep = canDoExport;
		})
	});


	return true;
}

const ExportWizardComponent: FunctionComponent<ToolComponentProps> = observer(({tool}) => {

	const classes = useStyles();

	const [ legendService, mapService, catalogService, configService ] = useService([ LegendService, MapService, CatalogService, ConfigService ]);
	const myState = useLocalObservable<ExportWizardComponentState>(() => {
		const exportLayers = new Map<string, Layer>();
		const exportLayersFeatureCount = new Map<string, number>();
		return {
			activeStep : undefined,
			exportLayers,
			exportLayersFeatureCount,
			exportResultsUrl: undefined,
			isExporting: false,
			isReadyForNextStep: true
		}
	});

	const ExportButton = MakeToolButtonComponent(
		GetApp,
		'Export data layers',
		() => {
			runInAction(() => {
				Array.from(legendService.enabledLayers).forEach(l => {
					myState.exportLayers.set(l.name, l);
				});
				myState.isReadyForNextStep = true;
				myState.activeStep = 1;
			})
		}
	);

	return (
		<>
			<ExportButton tool={tool} />
			<Dialog
				open={!!myState.activeStep}
				maxWidth='lg'
				onClose={() => {
					runInAction(() => {
						myState.activeStep = undefined;
					});
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
							runInAction(() => {
								myState.activeStep = undefined;
							});
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
						direction="row"
					>
						<Grid item xs={6} style={{
							minWidth: '40%',
							height: '100%',
							overflow: 'auto',
							paddingRight: '3em'
						}}>
							<TableContainer>
								<Table
									className={classes.table}
									size="small" // "medium"
									aria-label="enhanced table"
								>
									<TableHead>
										<TableRow>
											<TableCell padding="normal"></TableCell>
											<TableCell padding="normal">Layers to Export</TableCell>
											<TableCell padding="normal"></TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
									{Array.from(myState.exportLayers).map(([id, layer]) => (
										<TableRow
											hover
											key={layer.id}
										>
											<TableCell>{layer.queryName ? 'polygon' : layer.layerType}</TableCell>
											<TableCell>{layer.title}</TableCell>
											<TableCell>
												<Button
													onClick={() => {
														runInAction(() => {
															myState.exportLayers.delete(layer.name);
														});
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

						<Grid item xs={6} style={{
							height: '100%',
							overflow: 'auto'
						}}>
							<TableContainer>
								<Table
									className={classes.table}
									size="small" // "medium"
									aria-label="enhanced table"
								>
									<TableHead>
										<TableRow>
											<TableCell padding="normal"></TableCell>
											<TableCell padding="normal">Include More Layers?</TableCell>
											<TableCell padding="normal"></TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
									{catalogService.uniqueLayers.filter((l) => {
										return l['type'] !== 'tiled_overlay' || l['queryName'];

									}).map((node) => (
										<TableRow
											hover
											key={node.id}
										>
											<TableCell>{node.queryName ? 'polygon' : node.type}</TableCell>
											<TableCell>{node.title}</TableCell>
											<TableCell>
												<Button
													size="small"
													onClick={() => {
														runInAction(() => {
															const layer = new Layer(
																node.name!,
																node.style!,
																node.title!,
																node.type!,
																node.agol || configService.geoserverUrl + '/geoserver/wms',
																node.query || node.name!,
																configService.geoserverUrl,
															);
															myState.exportLayers.set(layer.name, layer);
														});
													}}
												>
													<Add />
												</Button>
											</TableCell>
										</TableRow>
									))}
									</TableBody>
								</Table>
							</TableContainer>
						</Grid>
					</Grid>
				)}

				{myState.activeStep === 3 && (
					<Grid
					className={classes.container}
					container
					direction="row"
					>
						<Grid item xs={12} style={{
							height: '100%',
							overflow: 'auto',
							paddingRight: '3em'
						}}>
							<TableContainer>
								<Table
									className={classes.table}
									size="small" // "medium"
									aria-label="enhanced table"
								>
									<TableHead>
										<TableRow>
											<TableCell padding="normal"></TableCell>
											<TableCell padding="normal">Data Layer Name</TableCell>
											<TableCell padding="normal">Feature(s) Found</TableCell>
											<TableCell padding="normal">OK to export?</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
									{Array.from(myState.exportLayers).map(([id, layer]) => (
										<TableRow
											hover
											key={layer.id}
										>
											<TableCell>{layer.queryName ? 'polygon' : layer.layerType}</TableCell>
											<TableCell>{layer.title}</TableCell>
											<TableCell>
												{!myState.exportLayersFeatureCount.has(layer.name) && (
													<span>loading...</span>
												)}
												{myState.exportLayersFeatureCount.has(layer.name) &&
													myState.exportLayersFeatureCount.get(layer.name)
												}
											</TableCell>
											<TableCell>
												{myState.exportLayersFeatureCount.has(layer.name) &&
													myState.exportLayersFeatureCount.get(layer.name)! > MAX_EXPORT_FEATURES &&
													(<div><Error /><div style={{ display: 'inline-block', verticalAlign: "super"}}>&gt; max # features </div></div>)
												}
												{myState.exportLayersFeatureCount.has(layer.name) &&
													myState.exportLayersFeatureCount.get(layer.name)! <= MAX_EXPORT_FEATURES &&
													(<div><Check /><div style={{ display: 'inline-block', verticalAlign: "super"}}>OK </div></div>)
												}
											</TableCell>
										</TableRow>
									))}
									</TableBody>
								</Table>
							</TableContainer>
						</Grid>
					</Grid>
				)}

				{myState.activeStep === 4 && (
					<Grid
						className={classes.container}
						container
						direction="row"
					>
						<Grid item xs={12} style={{
							padding: '1em'
						}}>
							<Typography variant="h6" id="tableTitle" component="div">
								Vector Data Export Format
							</Typography>
							<RadioGroup aria-label="vector-format" name="vector-format">
								{/* value={value} onChange={handleChange} */}
								<TableContainer >
									<Table
										className={classes.table}
										size="small" // "medium"
										aria-label="enhanced table"
										>
										<TableHead>
											<TableRow>
												<TableCell padding="normal"></TableCell>
												<TableCell padding="normal"></TableCell>
												<TableCell padding="normal"></TableCell>
											</TableRow>
										</TableHead>
										<TableBody>
											<TableRow hover>
												<TableCell>
													<FormControlLabel value="shp" control={<Radio />} label="ShapeFile (.shp)" />
												</TableCell>
												<TableCell>
													<FormControlLabel value="kml" control={<Radio />} label="Google Earth (.kml)" />
												</TableCell>
												<TableCell>
													<FormControlLabel value="xlsx" control={<Radio />} label="Excel (.xlsx)" />
												</TableCell>
											</TableRow>
											<TableRow>
												<TableCell>
													<FormControlLabel value="xls" control={<Radio />} label="Excel 97-2003 (.xls)" />
												</TableCell>
												<TableCell>
													<FormControlLabel value="csv" control={<Radio />} label="CSV (.csv)" />
												</TableCell>
												<TableCell></TableCell>
											</TableRow>
										</TableBody>
									</Table>
								</TableContainer>
							</RadioGroup>
						</Grid>

						<Grid item xs={12} style={{
							padding: '1em'
						}}>
							<Typography variant="h6" id="tableTitle" component="div">
								Raster Data Export Format
							</Typography>
							<RadioGroup aria-label="raster-format" name="raster-format">
								{/* value={value} onChange={handleChange} */}
								<TableContainer >
									<Table
										className={classes.table}
										size="small" // "medium"
										aria-label="enhanced table"
										>
										<TableHead>
											<TableRow>
												<TableCell padding="normal"></TableCell>
												<TableCell padding="normal"></TableCell>
											</TableRow>
										</TableHead>
										<TableBody>
											<TableRow hover>
												<TableCell>
													<FormControlLabel value="xlsx" control={<Radio checked disabled />} label="GeoTIFF (available in NAD83/Massachusetts State Plane Coordinate System, Mainland Zone, meters - EPSG:26986 coordinate system only)" />
												</TableCell>
											</TableRow>
										</TableBody>
									</Table>
								</TableContainer>
							</RadioGroup>
						</Grid>

						<Grid item xs={12} style={{
							padding: '1em'
						}}>
							<Typography variant="h6" id="tableTitle" component="div">
								Output Coordinate System
							</Typography>
							<RadioGroup aria-label="raster-format" name="raster-format">
								{/* value={value} onChange={handleChange} */}
								<TableContainer >
									<Table
										className={classes.table}
										size="small" // "medium"
										aria-label="enhanced table"
									>
										<TableHead>
											<TableRow>
												<TableCell padding="normal"></TableCell>
											</TableRow>
										</TableHead>
										<TableBody>
											<TableRow>
												<TableCell>
													<FormControlLabel value="26986" control={<Radio />} label="NAD83/Massachusetts State Plane Coordinate System, Mainland Zone, meters - EPSG:26986" />
												</TableCell>
											</TableRow>
											<TableRow>
												<TableCell>
													<FormControlLabel value="26918" control={<Radio checked disabled />} label="NAD83/UTM zone 18N, meters (Western Massachusetts) - EPSG:26918" />
												</TableCell>
											</TableRow>
											<TableRow>
												<TableCell>
													<FormControlLabel value="26919" control={<Radio checked disabled />} label="NAD83/UTM zone 19N, meters (Eastern Massachusetts) - EPSG:26919" />
												</TableCell>
											</TableRow>
											<TableRow>
												<TableCell>
													<FormControlLabel value="4326" control={<Radio checked disabled />} label="WGS84 (Latitude-Longitude) - EPSG:4326" />
												</TableCell>
											</TableRow>
										</TableBody>
									</Table>
								</TableContainer>
							</RadioGroup>
						</Grid>

						<Grid item xs={12} style={{
							padding: '1em'
						}}>
							<Typography variant="h6" id="tableTitle" component="div">
								Output Coordinate System
							</Typography>
							<RadioGroup aria-label="raster-format" name="raster-format">
								{/* value={value} onChange={handleChange} */}
								<TableContainer >
									<Table
										className={classes.table}
										size="small" // "medium"

										aria-label="enhanced table"
									>
										<TableHead>
											<TableRow>
												<TableCell padding="normal"></TableCell>
											</TableRow>
										</TableHead>
										<TableBody>
											<TableRow>
												<TableCell>
													Name of zipfile to download:<br/>
													<TextField id="output-filename" label="Output Filename" />
												</TableCell>
											</TableRow>
										</TableBody>
									</Table>
								</TableContainer>
							</RadioGroup>
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
								runInAction(() => {
									myState.activeStep = myState.activeStep! - 1;
									myState.activeStep <= 2 && (myState.isReadyForNextStep = true);
								});
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
						disabled={!myState.isReadyForNextStep}
						onClick={() => {
							runInAction(() => {
								myState.activeStep = myState.activeStep! + 1;
								myState.activeStep === 3 && calculateNumFeatures(myState, mapService.leafletMap!.getBounds(), configService.geoserverUrl);
							})
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