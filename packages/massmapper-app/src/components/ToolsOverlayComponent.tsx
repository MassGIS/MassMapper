import { observer } from 'mobx-react';
import React, { FunctionComponent } from 'react';
import { ToolPosition } from '../models/Tool';
import { ToolService } from '../services/ToolService';
import { useService } from '../services/useService';

const ToolsOverlayComponent: FunctionComponent = observer(() => {
	const toolService = useService(ToolService);
	return (
		<div
			style={{
				position: 'absolute',
				left: '60px',
				top: '10px',
				zIndex: 1000
			}}
		>
			{
				toolService.getTools(ToolPosition.topleft)
					.map((tool) => {
						const ToolComponent = tool.component();
						return (
							<div key={tool.id}><ToolComponent tool={tool}/></div>
						);
					})
			}
		</div>
	);
});


export default ToolsOverlayComponent;