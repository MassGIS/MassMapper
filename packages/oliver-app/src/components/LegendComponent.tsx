import {
	Checkbox,
	Tooltip,
	CircularProgress,
	IconButton
} from '@material-ui/core';
import {
	DeleteOutline,
	ErrorOutline
} from '@material-ui/icons';
import { makeStyles } from '@material-ui/core/styles';
import { Observer, observer } from 'mobx-react';
import React, { FunctionComponent } from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import { LegendService } from '../services/LegendService';
import { useService } from '../services/useService';
import 'leaflet/dist/leaflet.css';
import { ClassNameMap } from '@material-ui/styles';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

interface LegendComponentProps extends RouteComponentProps<any> {
}

const useStyles = makeStyles((theme) => ({
	button: {
		padding: '0',
	}
}));

const LegendComponent: FunctionComponent<LegendComponentProps> = observer(({}) => {

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
					<Observer>{(): JSX.Element => {
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
													style={{position: 'absolute', left: 'calc(50% - 12px)'}}
												/> : status;

										}
										else {
											status =
												<Tooltip title="Only available at closer zooms.">
													<ErrorOutline fontSize="small"/>
												</Tooltip>;
										}
									}

									return (
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
															display: 'inline-block'
														}}>
															<Checkbox
																className={classes.button}
																onChange={(e) => {
																	l.enabled = e.target.checked;
																}}
																checked={l.enabled}
																color="default"
															/>

															<IconButton
																className={classes.button}
																onClick={() => {
																	legendService.removeLayer(l);
																}}
															>
																<DeleteOutline />
															</IconButton>
														</div>

														<div style={{
															display: 'inline-block'
														}}>
															{l.title}
														</div>

														<div style={{position: 'relative', textAlign: 'center'}}>
															{image}
															{status}
														</div>
													</div>
												</div>
											)}
										</Draggable>
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
