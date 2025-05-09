import { Button } from "@material-ui/core";
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
}

const ColorPaletteComponent: FunctionComponent<ColorPaletteComponentProps> = observer(({onClick}) => {
    const [ selectedColor, setSelectedColor ] = useState('blue');
    return (
        <> {COLOR_PALETTE.map(({name, hex}) => {
            return (<Button
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
                />
            </Button>)
        })
    } </>)
});

export default ColorPaletteComponent;