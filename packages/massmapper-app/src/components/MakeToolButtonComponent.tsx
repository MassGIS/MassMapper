import { observer } from "mobx-react";
import React, { FunctionComponent, MouseEventHandler } from 'react';
import { ToolComponentProps } from "../models/Tool";
import { Button } from '@material-ui/core';

const MakeToolButtonComponent = (Icon:any, tooltip:string, onclick?: MouseEventHandler, isDisabled?: () => boolean, buttonStyle?: React.CSSProperties): FunctionComponent<ToolComponentProps> => {
	return observer(({tool}) => {
		const disabled = isDisabled ? isDisabled() : false;
		const style = {
			backgroundColor: tool.isActive ? '' : 'white',
			minWidth: '32px',
			...buttonStyle
		}
		return (
			<>
				<Button
					style={style}
					disabled={disabled}
					color="default"
					title={tooltip}
					variant="contained"
					size="small"
					onClick={onclick ? onclick : () => {
						tool.isActive ? tool.deactivate(true) : tool.activate();
					}}
				>
				{typeof(Icon) === 'string' ? (
					<img
						style={{
							height: '24px',
						}}
						src={Icon}
					/>
				):
				(<Icon />)
				}
				</Button>
			</>
		);
	})
};


export { MakeToolButtonComponent};