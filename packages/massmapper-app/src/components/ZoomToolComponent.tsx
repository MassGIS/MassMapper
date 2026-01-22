import {
	Add,
	Remove
} from '@material-ui/icons'

import { observer } from 'mobx-react-lite';
import React, { FunctionComponent } from "react";
import { ToolComponentProps } from '../models/Tool';

import { ZoomTool } from '../models/ZoomTool';
import { MakeToolButtonComponent } from './MakeToolButtonComponent';

import { MapService } from '../services/MapService';
import { useService } from '../services/useService';

const ZoomToolComponent: FunctionComponent<ToolComponentProps> = observer(({tool: _tool}) => {
	const tool = _tool as ZoomTool;
	const [mapService] = useService([MapService]);

	const ZoomInButton = MakeToolButtonComponent(
		Add,
		'Zoom In',
		(e) => {
			tool.zoomIn();
		},
		() => {
			return mapService.mapZoom >= mapService.layersMaxZoom!;
		},
		{
			minWidth: '30px',
			maxWidth: '30px',
		}
	);
	const ZoomOutButton = MakeToolButtonComponent(
		Remove,
		'Zoom Out',
		(e) => {
			tool.zoomOut();
		},
		() => {
			console.log(mapService.layersMinZoom)
			return mapService.mapZoom <= mapService.layersMinZoom!;
		},
		{
			minWidth: '30px',
			maxWidth: '30px',
		}
	);

	return (
		<>
			<div style={{
				marginBottom: '.5em'
			}}>
				<ZoomInButton
					tool={tool}
				/>
			</div>
			<div>
				<ZoomOutButton
					tool={tool}
				/>
			</div>
		</>
	);
});

export { ZoomToolComponent }