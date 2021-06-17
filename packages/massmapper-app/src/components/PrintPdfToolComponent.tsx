import {
	Button,
	Grid,
	TextField,
	Dialog,
	DialogTitle,
	DialogContent,
	LinearProgress
} from '@material-ui/core'
import {
	Cancel,
	Print
} from '@material-ui/icons';
import { latLngBounds, latLng } from 'leaflet';
import { observer, useLocalObservable } from 'mobx-react-lite';
import React, { FunctionComponent } from "react";
import { ToolComponentProps } from '../models/Tool';
import { MapService } from '../services/MapService';
import { useService } from '../services/useService';

import { MakeToolButtonComponent } from './MakeToolButtonComponent';
import { PrintPdfTool } from '../models/PrintPdfTool';

interface PrintPdfToolComponentState {
	title:string,
	filename:string,
	isOpen: boolean,
	isPrinting: boolean,
}

const PrintPdfToolComponent: FunctionComponent<ToolComponentProps> = observer(({tool}) => {
	const myState = useLocalObservable<PrintPdfToolComponentState>(() => {
		return {
			isOpen: false,
			title: '',
			filename: 'massmapper.pdf',
			isPrinting: false,
		}
	});
	const [mapService] = useService([MapService]);
	const myTool = tool as PrintPdfTool;

	const PrintPdfButton = MakeToolButtonComponent(Print, 'Print map', () => {
		myState.isOpen = true;
	});

	return (
		<>
			<PrintPdfButton tool={tool}/>
			<Dialog
				open={myState.isOpen}
				onClose={() => {
					if (myState.isPrinting) {
						// have to wait
						return;
					}
					myState.isOpen = false;
				}}
			>
				<DialogTitle>
					Print Map PDF
				</DialogTitle>
				<DialogContent>
					{myState.isPrinting && (
						<LinearProgress
							title="Printing..."
						/>
					)}
					{!myState.isPrinting && (
						<>
							<Grid
								style={{
									height:'85%',
									padding: '1em',
									margin: '.5em'
								}}
							>
								<TextField
									placeholder="Map Title"
									value={myState.title}
									helperText="Map Title"
									onChange={(e) => {
										myState.title = e.target.value;
									}}
								/>
								<br/><br/>
								<TextField
									placeholder="Filename"
									value={myState.filename}
									helperText="PDF Filename"
									onChange={(e) => {
										myState.filename = e.target.value;
									}}
								/>
							</Grid>
							<Grid
								style={{
									height:'15%',
									padding: '1em',
									margin: '.5em'
								}}
							>
								<Button
									style={{
										marginRight: '.5em'
									}}
									value="Print"
									variant="contained"
									onClick={async () => {
										myState.isPrinting = true;
										await myTool.makePDF(myState.title, myState.filename);
										myState.isOpen = false;
										myState.isPrinting = false;
									}}
								>
									<Print /> Print Map
								</Button>
								<Button
									value="Print"
									variant="contained"
									onClick={async () => {
										myState.isOpen = false;
										myState.isPrinting = false;
									}}
								>
									<Cancel /> Cancel
								</Button>
							</Grid>
						</>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
});

export { PrintPdfToolComponent }