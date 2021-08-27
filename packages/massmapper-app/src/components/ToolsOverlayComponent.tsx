import { observer } from 'mobx-react';
import React, { FunctionComponent } from 'react';
import { ToolPosition } from '../models/Tool';
import { ToolService } from '../services/ToolService';
import { useService } from '../services/useService';

const ToolsOverlayComponent: FunctionComponent = observer(() => {
	const toolService = useService(ToolService);
	return (
		<>
			<div
				style={{
					position: 'absolute',
					left: '60px',
					top: '10px',
					zIndex: 1000,
					display: 'flex',
					flexDirection: 'row',
				}}
			>
				{
					toolService.getTools(ToolPosition.topleft)
						.map((tool) => {
							const ToolComponent = tool.component();
							return (
								<div
									style={{
										marginRight:'.8em',
									}}
									key={tool.id}><ToolComponent
									tool={tool}
								/></div>
							);
						})
				}
			</div>

			<div
				style={{
					position: 'absolute',
					left: '10px',
					top: '100px',
					zIndex: 1000,
					display: 'flex',
					flexDirection: 'column',
				}}
			>
				{
					toolService.getTools(ToolPosition.topleftvertical)
						.map((tool) => {
							const ToolComponent = tool.component();
							return (
								<div
									style={{
										marginRight:'.8em',
									}}
									key={tool.id}><ToolComponent
									tool={tool}
								/></div>
							);
						})
				}
			</div>

			<div
				style={{
					position: 'absolute',
					right: '80px',
					top: '10px',
					zIndex: 1000,
					display: 'flex',
					flexDirection: 'row-reverse',
				}}
			>
			{
				toolService.getTools(ToolPosition.topright)
					.map((tool) => {
						const ToolComponent = tool.component();
						return (
							<div
								style={{
									marginRight:'.8em',
								}}
								key={tool.id}><ToolComponent
								tool={tool}
							/></div>
						);
					})
			}
			</div>

			<div
				style={{
					position: 'absolute',
					right: '0px',
					bottom: '15px',
					zIndex: 1000,
					display: 'flex',
					flexDirection: 'row-reverse',
				}}
			>
			{
				toolService.getTools(ToolPosition.bottomright)
					.map((tool) => {
						const ToolComponent = tool.component();
						return (
							<div
								style={{
									marginRight:'.8em',
								}}
								key={tool.id}><ToolComponent
								tool={tool}
							/></div>
						);
					})
			}
			</div>
		</>
	);
});


export default ToolsOverlayComponent;