import {
	Button,
	Grid,
	Checkbox,
	Tooltip,
	CircularProgress,
	IconButton,
	Paper,
	Slider,
	Typography
} from '@material-ui/core';
import {
	ArrowRight,
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

const LegendOpacityEditor: FunctionComponent<{layer: Layer, state: LegendComponentState}> = observer(({layer, state}) => {
	return (
		<Paper
			elevation={5}
			style={{
				position: 'relative',
				float: 'right',
				width: '200px',
				zIndex: 100,
				right: '94px',
				top: '10px',

			}}
		>
			<Grid>
				<Grid
					style={{
						position: 'absolute',
						right: '0px',
						top: '4px',
					}}
				>
					<Button
						variant="text"
						onClick={() => {
							state.layerOpacityToEdit = undefined;
						}}
					>
						<Close />
					</Button>
				</Grid>
				<Grid
					style={{
						margin: '1em'
					}}
				>
					<Typography
						id="opacity-slider"
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
			</Grid>
		</Paper>
	)
});

const LegendComponent: FunctionComponent<LegendComponentProps> = observer(({}) => {

	const myState = useLocalObservable<LegendComponentState>(() => {
		return {
		}
	});

	const [ legendService ] = useService([ LegendService ]);
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
											status =
												<Tooltip title="Zoom in closer to see this layer">
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
													return (<LegendOpacityEditor layer={l} state={myState} />);
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

																<Tooltip title="Change layer opacity">
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
																<div style={{
																	display: 'inline-block',
																	fontSize: '16px',
																	paddingLeft: '3px',
																	paddingTop: '2px'
																}}>
																	{l.title}
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
