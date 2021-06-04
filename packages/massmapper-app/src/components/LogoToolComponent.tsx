import React, { FunctionComponent } from "react";
import {
	Button
} from '@material-ui/core';
import { ToolComponentProps } from "../models/Tool";

const LogoToolComponent: FunctionComponent<ToolComponentProps> = ({tool}) => {
	const {logoUrl, logoLink, logoTooltip} = tool.options;
	return (
		<>
			<Button
				color="default"
				title={logoTooltip}
				size="small"
				onClick={() => {
					window.open(logoLink)
				}}
			>
				<img
					style={{
						height: '44px',
					}}
					src={logoUrl}
				/>
			</Button>
		</>
	)
};

export { LogoToolComponent }