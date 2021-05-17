import { observer } from "mobx-react";
import React, { FunctionComponent } from 'react';
import { ToolComponentProps } from "../models/Tool";
import { Button } from '@material-ui/core';

const MakeToolButtonComponent = (icon:any, tooltip:string): FunctionComponent<ToolComponentProps> => {
	return observer(({tool}) => {
		return (
			<>
				<Button
					style={{
						backgroundColor: tool.isActive ? '' : 'white',
					}}
					color="default"
					title={tooltip}
					variant="contained"
					size="small"
					onClick={() => {
						tool.isActive ? tool.deactivate(true) : tool.activate();
					}}
				>
					<img
						style={{
							height: '24px',
						}}
						src={icon}
					/>
				</Button>
			</>
		);
	})
};


export { MakeToolButtonComponent};