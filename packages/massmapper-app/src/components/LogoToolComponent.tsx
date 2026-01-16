import React, { FunctionComponent } from "react";
import {
	Button,
	Tooltip
} from '@material-ui/core';
import { ToolComponentProps } from "../models/Tool";

const LogoToolComponent: FunctionComponent<ToolComponentProps> = ({tool}) => {
	const {logoUrl, logoLink, logoTooltip, logoHeight, logoAlt} = tool.options;
	return (
		<Tooltip title={logoTooltip}>
			<Button
				color="default"
				size="small"
				onClick={() => {
					window.open(logoLink)
				}}
			>
				<img
					style={{
						height: logoHeight || '44px',
					}}
					src={logoUrl}
					alt={logoAlt}
				/>
			</Button>
		</Tooltip>
	)
};

export { LogoToolComponent }