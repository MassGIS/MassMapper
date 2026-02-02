import { Button, Grid, Typography, Tooltip } from "@material-ui/core";
import { observer } from "mobx-react";
import React, { FunctionComponent, useState } from "react";

const COLOR_PALETTE = [
	{
		name: "White",
		hex: "#FFFFFF"
	},
	{
		name: "Tan",
		hex: "#D7C29E"
	},
	{
		name: "Grey",
		hex: '#686868'
	},
	{
		name: "Pink",
		hex: '#FFBEBE'
	},
	{
		name: "Red",
		hex: "#FE0108"
	},
	{
		name: "Orange",
		hex: "#FFD380"
	},
	{
		name: "Yellow",
		hex: "#FFFC01"
	},
	{
		name: "Green",
		hex: "#55FD00"
	},
	{
		name: "Blue",
		hex: "#00C5FF"
	},
	{
		name: "Dark_Blue",
		hex: "#005CE6"
	},
	{
		name: "Purple",
		hex: "#C627FF"
	},
	{
		name: "Black",
		hex: "#000000"
	}
];

interface ColorPaletteComponentProps {
    onClick: ( colorName: string, colorHex: string ) => void;
		value? :string;
		hasReset?: boolean;
}

const ColorPaletteComponent: FunctionComponent<ColorPaletteComponentProps> = observer(({onClick, value, hasReset}) => {
    const [ selectedColor, setSelectedColor ] = useState(value);
    return (
        <>
					<Grid>
						{COLOR_PALETTE.map(({name, hex}) => {
							return (
								<Tooltip
									title={name.replace(/_/g, ' ')}
								>
									<Button
										key={hex}
										value={name}
										onClick={(e) => {
												setSelectedColor(name);
												return onClick(name, hex)
										}}
										style={{
												backgroundColor: selectedColor === name ? 'grey': ''
										}}
									>
										<div
												style={{
														backgroundColor: hex,
														border: '1px solid black',
														height: '15px',
														width: '15px',
												}}
												aria-label={name.replace(/_/g, ' ')}
										/>
									</Button>
								</Tooltip>
							)
						})}
					</Grid>
					{hasReset && selectedColor !== undefined && (
						<Grid>
									<Button
										onClick={() => {
											setSelectedColor(undefined);
											return onClick('', '');
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
						</Grid>
					)}
				</>
		)
});

export default ColorPaletteComponent;