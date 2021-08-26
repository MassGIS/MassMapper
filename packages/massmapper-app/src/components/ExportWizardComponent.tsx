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
	Paper,
	PaperProps,
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

import { autorun, reaction, runInAction } from 'mobx';
import { observer } from 'mobx-react';
import { useLocalObservable } from 'mobx-react-lite';

import React, { FunctionComponent, useEffect } from 'react';

import { useService } from '../services/useService';
import { LegendService } from '../services/LegendService';
import { ConfigService } from '../services/ConfigService';
import { ToolComponentProps } from '../models/Tool';
import { Layer } from '../models/Layer';
import { CatalogService } from '../services/CatalogService';
import { MakeToolButtonComponent } from './MakeToolButtonComponent';
import { MapService } from '../services/MapService';
import { LatLngBounds } from 'leaflet';
import { ExportWizardTool } from '../models/ExportWizardTool';

const selectedColor = '#eee';
const hoverColor = '#ccc';

const useStyles = makeStyles((theme) => ({
		paper: {
			'& .MuiPaper-root': {
				height: '70vh',
				width: '90vw'
			}
		},
		container: {
			flexGrow: 1,
			height: '60%',
		},
		exportContainer: {
			flexGrow: 1,
			height: '60%',
			overflowY: 'scroll',
			'& .MuiRadio-root': {
				padding: '4px'
			},
			'& .MuiTableCell-root': {
				paddingTop: '0px',
				paddingBottom: '0px',
			},
			'& .MuiTypography-body1': {
				fontSize: '.8rem',
			}
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


	const PaperComponent: FunctionComponent<PaperProps> = (props: PaperProps) => {
			return (
					<Paper {...props} />
				);
			}

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

// interface ExportWizardComponentState {
// 	activeStep: number | undefined;
// 	exportFileUrl?: string;
// 	exportFileName?: string;
// 	exportLayers: Map<string,Layer>;
// 	exportLayersFeatureCount: Map<string, number>;
// 	isExporting: boolean;
// 	isReadyForNextStep: boolean;
// }

const ExportWizardComponent: FunctionComponent<ToolComponentProps> = observer(({tool: _tool}) => {

	const tool = _tool as ExportWizardTool;
	const classes = useStyles();

	const [ legendService, mapService, catalogService, configService ] = useService([ LegendService, MapService, CatalogService, ConfigService ]);
	// const myState = useLocalObservable<ExportWizardComponentState>(() => {
	// 	const exportLayers = new Map<string, Layer>();
	// 	const exportLayersFeatureCount = new Map<string, number>();
	// 	return {
	// 		activeStep : undefined,
	// 		exportLayers,
	// 		exportLayersFeatureCount,
	// 		exportResultsUrl: undefined,
	// 		isExporting: false,
	// 		isReadyForNextStep: true
	// 	}
	// });

	// useEffect(() => {
	// 	reaction(
	// 		() => myState.activeStep,
	// 		async (currentStep, previousStep, reaction) => {
	// 			if (currentStep === previousStep && currentStep !== 0) {
	// 				return;
	// 			}
	// 			if (currentStep === 1) {
	// 				myState.isReadyForNextStep = true;
	// 				return;
	// 			}
	// 			myState.isReadyForNextStep = false;
	// 			if (currentStep === 2) {
	// 				if (myState.exportLayers.size > 0) {
	// 					myState.isReadyForNextStep = true;
	// 				}
	// 			} else if (currentStep === 3) {
	// 				myState.isReadyForNextStep = await calculateNumFeatures(myState, mapService.leafletMap!.getBounds(), configService.geoserverUrl);
	// 			} else if (currentStep === 4) {
	// 				myState.isReadyForNextStep === !!myState.exportFileName;
	// 			}
	// 		}
	// 	);
	// })

	const ExportButton = MakeToolButtonComponent(
		GetApp,
		'Export data layers',
		() => {
			runInAction(() => {
				Array.from(legendService.enabledLayers).forEach(l => {
					tool.exportLayers.set(l.name, l);
				});
				tool.activeStep = 1;
			})
		}
	);

	return (
		<>
			<ExportButton tool={tool} />
			<Dialog
				open={!!tool.activeStep}
				maxWidth='lg'
				className={classes.paper}
				onClose={() => {
					runInAction(() => {
						tool.activeStep = undefined;
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
								tool.activeStep = undefined;
							});
						}}
					>
						<Close />
					</Button>
				</DialogActions>

				<DialogTitle>
					Export Wizard - &nbsp;&nbsp;
					{tool.activeStep <= 4 && (<>Step {tool.activeStep}/4</>)}
					{tool.activeStep === 5 && (<>Running Export</>)}
				</DialogTitle>

				{tool.isExporting && (
					<Dialog
						maxWidth="xl"
						open={tool.isExporting}
					>
						<DialogTitle id="export-dialog-title">Exporting Data</DialogTitle>
						<DialogContent>
							<LinearProgress />
						</DialogContent>
					</Dialog>
				)}

				{tool.activeStep === 1 && (
					<HowtoComponent />
				)}

				{tool.activeStep === 2 && (
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
									{Array.from(tool.exportLayers).map(([id, layer]) => (
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
															tool.exportLayers.delete(layer.name);
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
															tool.exportLayers.set(layer.name, layer);
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

				{tool.activeStep === 3 && (
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
									{Array.from(tool.exportLayers).map(([id, layer]) => (
										<TableRow
											hover
											key={layer.id}
										>
											<TableCell>{layer.queryName ? 'polygon' : layer.layerType}</TableCell>
											<TableCell>{layer.title}</TableCell>
											<TableCell>
												{!tool.exportLayersFeatureCount.has(layer.name) && (
													<span>loading...</span>
												)}
												{tool.exportLayersFeatureCount.has(layer.name) &&
													tool.exportLayersFeatureCount.get(layer.name)
												}
											</TableCell>
											<TableCell>
												{tool.exportLayersFeatureCount.has(layer.name) &&
													tool.exportLayersFeatureCount.get(layer.name)! > tool.MAX_EXPORT_FEATURES &&
													(<div><Error /><div style={{ display: 'inline-block', verticalAlign: "super"}}>&gt; max # features </div></div>)
												}
												{tool.exportLayersFeatureCount.has(layer.name) &&
													tool.exportLayersFeatureCount.get(layer.name)! <= tool.MAX_EXPORT_FEATURES &&
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

				{tool.activeStep === 4 && (
					<Grid
						className={classes.exportContainer}
						container
						direction="row"
					>
						<Grid item xs={12} style={{
							padding: '1em'
						}}>
							<Typography variant="h6" id="tableTitle" component="div">
								Vector Data Export Format
							</Typography>
							<RadioGroup
								aria-label="vector-format"
								name="vector-format"
								value={tool.exportFormat}
								onChange={(e) => {
									runInAction(() => {
										tool.exportFormat = e.target.value;
									});
								}}
							>
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
													<FormControlLabel value="xlsx" control={<Radio checked />} label="GeoTIFF (available in NAD83/Massachusetts State Plane Coordinate System, Mainland Zone, meters - EPSG:26986 coordinate system only)" />
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
							<RadioGroup
								aria-label="coord-system"
								name="coord-system"
								value={tool.exportCRS}
								onChange={(e) => {
									runInAction(() => {
										tool.exportCRS = e.target.value;
									})
								}}
							>
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
													<FormControlLabel value="26918" control={<Radio />} label="NAD83/UTM zone 18N, meters (Western Massachusetts) - EPSG:26918" />
												</TableCell>
											</TableRow>
											<TableRow>
												<TableCell>
													<FormControlLabel value="26919" control={<Radio />} label="NAD83/UTM zone 19N, meters (Eastern Massachusetts) - EPSG:26919" />
												</TableCell>
											</TableRow>
											<TableRow>
												<TableCell>
													<FormControlLabel value="4326" control={<Radio />} label="WGS84 (Latitude-Longitude) - EPSG:4326" />
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
								Export File Name
							</Typography>
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
												<TextField
													id="output-filename"
													label="Output Filename"
													onChange={(e) => {
														runInAction(() => {
															tool.exportFileName = e.target.value;
														});
													}}
												/>
											</TableCell>
										</TableRow>
									</TableBody>
								</Table>
							</TableContainer>
						</Grid>
					</Grid>
				)}

				{tool.activeStep !== 5 &&(
					<DialogActions>
						{tool.activeStep !== 1 && (
							<Button
								size="small"
								style={{
									float: 'right'
								}}
								onClick={() => {
									runInAction(() => {
										tool.activeStep = tool.activeStep! - 1;
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
							disabled={!tool.isReadyForNextStep}
							onClick={() => {
								runInAction(() => {
									tool.activeStep = tool.activeStep! + 1;
									tool.activeStep === 3 && tool.calculateNumFeatures()
								})
							}}
						>
							Next <NavigateNext />
						</Button>
					</DialogActions>
				)}
			</Dialog>
		</>
	);
});

export default ExportWizardComponent;