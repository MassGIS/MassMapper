import { Button } from "@material-ui/core";
import { observer } from "mobx-react";
import React, { FunctionComponent, useState } from "react";

const COLOR_PALETTE = [
	{
		name: "White",
		hex: "white"
	},
	{
		name: "Tan",
		hex: "tan"
	},
	{
		name: "Grey",
		hex: 'grey'
	},
	{
		name: "Pink",
		hex: 'pink'
	},
	{
		name: "Red",
		hex: "red"
	},
	{
		name: "Orange",
		hex: "orange"
	},
	{
		name: "Yellow",
		hex: "yellow"
	},
	{
		name: "Green",
		hex: "green"
	},
	{
		name: "Blue",
		hex: "blue"
	},
	{
		name: "Dark_Blue",
		hex: "darkblue"
	},
	{
		name: "Purple",
		hex: "purple"
	},
	{
		name: "Black",
		hex: "black"
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