import {
	Button,
	Checkbox,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Grid,
	IconButton,
	Slider,
	Tooltip,
	Typography
} from '@material-ui/core';
import {
	Close,
	DeleteOutline,
	ErrorOutline,
	TuneOutlined
} from '@material-ui/icons';
import { makeStyles } from '@material-ui/core/styles';
import { Observer, observer, useLocalObservable } from 'mobx-react';
import React, { FunctionComponent } from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import { Layer, LegendService } from '../services/LegendService';
import { useService } from '../services/useService';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { MapService } from '../services/MapService';

interface LegendComponentProps extends RouteComponentProps<any> {
}

const useStyles = makeStyles((theme) => ({
	button: {
		paddingRight: '2px',
		paddingTop: '0',
		paddingBottom: '0',
		paddingLeft: '0'
	}
}));

interface LegendComponentState {
	layerOpacityToEdit?: Layer;
	activeOpacity?: number;
}

const LegendCustomPropertiesEditor: FunctionComponent<{layer: Layer, state: LegendComponentState}> = observer(({layer, state}) => {
	return (
		<Dialog
			open
			maxWidth="xs"
		>
			<DialogActions>
				<Button
					style={{
						float: 'right'
					}}
					variant="text"
					onClick={() => {
						state.layerOpacityToEdit = undefined;
					}}
				>
					<Close />
				</Button>
			</DialogActions>
			<DialogTitle>
				Customize Layer Settings
			</DialogTitle>
			<DialogContent>

				<Grid
					container
					direction="row"
				>
					<Grid
						style={{
							margin: '1em 2em',
							width: '100%'
						}}
					>
						<Typography
							gutterBottom
						>
							Opacity
						</Typography>
						<Slider
							color="secondary"
							value={state.activeOpacity}
							valueLabelDisplay="auto"
							min={0}
							max={100}
							onChange={(e, v) => {
								state.activeOpacity = v as number;
							}}
							onChangeCommitted={(e, v) => {
								state.activeOpacity = v as number;
								layer.opacity = v as number;
							}}
						/>
					</Grid>
					{layer.layerType !== 'tiled_overlay' && (
						<Grid
							style={{
								margin: '1em 2em'
							}}
							item
						>
							<Typography
								gutterBottom
							>
								Custom Color
							</Typography>
							<Grid>
								{COLOR_PALETTE.map(({name, hex}) => {
									return (<Button
										value={name}
										onClick={() => {
											layer.customColor = name;
										}}
										style={{
											backgroundColor: layer.customColor === name ? 'grey': ''
										}}
									>
										<div
											style={{
												backgroundColor: hex,
												border: '1px solid black',
												height: '15px',
												width: '15px',
											}}
										/>
									</Button>)
								})}
							</Grid>
							<Grid>
								{layer.customColor && (
									<Button
										onClick={() => {
											layer.customColor = undefined;
										}}
									>
										<Typography
											id="opacity-slider"
											gutterBottom
											variant="caption"
										>
											clear custom color
										</Typography>
									</Button>
								)}
							</Grid>
						</Grid>
					)}
				</Grid>
			</DialogContent>
		</Dialog>
	)
});

const COLOR_PALETTE = [
	{
		name: "White",
		hex: "white"
	},
	{
		name: "Tan",
		hex: "tan"
	},
	{
		name: "Grey",
		hex: 'grey'
	},
	{
		name: "Pink",
		hex: 'pink'
	},
	{
		name: "Red",
		hex: "red"
	},
	{
		name: "Orange",
		hex: "orange"
	},
	{
		name: "Yellow",
		hex: "yellow"
	},
	{
		name: "Green",
		hex: "green"
	},
	{
		name: "Blue",
		hex: "blue"
	},
	{
		name: "Dark_Blue",
		hex: "darkblue"
	},
	{
		name: "Purple",
		hex: "purple"
	},
	{
		name: "Black",
		hex: "black"
	}
];

const LegendComponent: FunctionComponent<LegendComponentProps> = observer(({}) => {

	const myState = useLocalObservable<LegendComponentState>(() => {
		return {
		}
	});

	const [ legendService, mapService ] = useService([ LegendService, MapService ]);
	const classes = useStyles();

	return (
		<DragDropContext
			onDragEnd={(result) => {
				return;
			}}
			onDragUpdate={(result) => {
				const layer = legendService.getLayerById(result.draggableId);
				result.destination && legendService.moveLayer(layer, result.destination.index);
			}}
		>
			<Droppable droppableId="layer-list">
				{(provided) => (
					<Observer>{() => {
						return (
							<div
								ref={provided.innerRef}
								{...provided.droppableProps}
							>
								{legendService.layers.map((l, i) => {
									let status = <span/>;
									let image = <span/>;

									if (l.enabled) {
										if (l.scaleOk) {
											image = l.legendURL ? (
												<img
													src={l.legendURL}
													className='img-fluid'
													alt={l.name}
													style={{opacity: l.isLoading ? 0.5 : 1}}
												/>
											) : image;
											status = l.isLoading ?
												<CircularProgress
													size="24px"
													thickness={8}
													color="secondary"
													style={{position: 'absolute', left: '0px'}}
												/> : status;

										}
										else {
											const title = l.minScale > mapService.currentScale ?
												'Zoom out to see this layer' :
												'Zoom in closer to see this layer';
											status =
												<Tooltip title={title}>
													<IconButton className={classes.button}>
														<ErrorOutline fontSize="small"/>
													</IconButton>
												</Tooltip>;
										}
									}

									return (
										<span
											key={l.id}
										>
											<Observer>{() => {
												if (myState.layerOpacityToEdit === l) {
													return (<LegendCustomPropertiesEditor layer={l} state={myState} />);
												}
												return null;
											}}</Observer>
											<Draggable key={l.id} draggableId={l.id} index={i}>
												{(provided) => (
													<div
														{...provided.draggableProps}
														{...provided.dragHandleProps}
														ref={provided.innerRef}
														key={`layer-${l.id}`}
													>

														<div style={{whiteSpace: 'pre'}}>
															<div style={{
																display: 'inline-block',
																position: 'relative'
															}}>
																<Tooltip title={l.enabled ? 'Click to disable layer' : 'Click to enable layer'}>
																	<Checkbox
																		className={classes.button}
																		onChange={(e) => {
																			l.enabled = e.target.checked;
																		}}
																		checked={l.enabled}
																		color="default"
																	/>
																</Tooltip>

																<Tooltip title="Remove layer from map">
																	<IconButton
																		className={classes.button}
																		onClick={() => {
																			legendService.removeLayer(l);
																		}}
																	>
																		<DeleteOutline />
																	</IconButton>
																</Tooltip>

																<Tooltip title="Customize Layer Settings">
																	<IconButton
																		className={classes.button}
																		onClick={() => {
																			myState.activeOpacity = l.opacity;
																			myState.layerOpacityToEdit = l;
																		}}
																	>
																		<TuneOutlined />
																	</IconButton>
																</Tooltip>

																{status}
															</div>

															<Tooltip title={l.title}>
																<div
																	style={{
																		display: 'inline-block',
																		fontSize: '16px',
																		paddingLeft: '3px',
																		paddingTop: '2px'
																	}}
																>
																	<a
																		href={l.metadataUrl}
																		target="_blank"
																	>
																		{l.title}
																	</a>
																</div>
															</Tooltip>

															<div style={{
																position: 'relative',
																textAlign: 'left',
																marginLeft: '3em'
															}}>
																{image}
															</div>
														</div>
													</div>
												)}
											</Draggable>
										</span>
									);
								})}
								{provided.placeholder}
							</div>
						)
					}}</Observer>
				)}
			</Droppable>
		</DragDropContext>
	);
});

export default withRouter(LegendComponent);
