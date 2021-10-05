import {
	Button,
	Grid,
	TextField,
	Dialog,
	DialogTitle,
	DialogContent,
	LinearProgress,
	Radio,
	FormHelperText
} from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles';
import {
	Cancel,
	Print,
	CheckCircle
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
	size:string,
	isPrinting: boolean,
}

const useStyles = makeStyles((theme) => ({
	dialog: {
		'& .MuiPaper-root': {
			pointerEvents: 'auto'
		},
		'&' : {
			pointerEvents: 'none'
		}
	}
}));

const PrintPdfToolComponent: FunctionComponent<ToolComponentProps> = observer(({tool}) => {
	const myState = useLocalObservable<PrintPdfToolComponentState>(() => {
		return {
			title: '',
			filename: 'massmapper.pdf',
			isPrinting: false,
			size: 'letter'
		}
	});
	const myTool = tool as PrintPdfTool;

	const mapService = useService(MapService);

	const PrintPdfButton = MakeToolButtonComponent(Print, 'Create a PDF map', () => {
		tool.activate();
	});

	const classes = useStyles();

	return (
		<>
			<PrintPdfButton tool={tool}/>
			<Dialog
				open={myTool.isOpen}
				maxWidth='lg'
				className={classes.dialog}
				BackdropProps={{
					invisible: true,
					style: {
						pointerEvents: 'none'
					}
				}}
				onClose={() => {
					if (myState.isPrinting) {
						// have to wait
						return;
					}
					tool.deactivate();
					myState.title = '';
					myState.filename = 'massmapper.pdf';
				}}
			>
				<DialogTitle>
					Create PDF
				</DialogTitle>
				<DialogContent
					style={{
						overflowY: 'hidden'
					}}
				>
					{!mapService.activeBaseLayer?.pdfOk && (
						<>
							<Grid
								style={{
									height:'70%',
									padding: '1em',
									margin: '.5em'
								}}
							>
								We're sorry, but the {mapService.activeBaseLayer?.name} cannot be printed.
								Please select another basemap.
							</Grid>
							<Grid
								style={{
									height:'30%',
									padding: '1em',
									margin: '.5em',
									textAlign: 'center'
								}}
							>
								<Button
									variant="contained"
									onClick={async () => {
										myTool.isOpen = false;
									}}
								>
									<CheckCircle/> OK
								</Button>
							</Grid>
						</>

					)}
					{mapService.activeBaseLayer?.pdfOk && myState.isPrinting && (
						<LinearProgress
							title="Printing..."
						/>
					)}
					{mapService.activeBaseLayer?.pdfOk && !myState.isPrinting && (
						<>
							<Grid
								style={{
									height:'70%',
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
									inputProps={{ maxLength: 75 }}
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
								<br/><br/>
								<div style={{
									color: 'rgba(0, 0, 0, 0.54)'
								}}								>
									Page Size
								</div>
								<Radio
									checked={myState.size === 'letter'}
									onClick={() => {
										myState.size = 'letter';
									}}
								/>
								<div style={{
									width: '4em',
									display: 'inline-block',
									color: myState.size === 'letter' ? '' : 'gray'
								}}>
									8.5 X 11
								</div>
								<Radio
									checked={myState.size === 'legal'}
									onClick={() => {
										myState.size = 'legal';
									}}
								/>
								<div style={{
									width: '4em',
									display: 'inline-block',
									color: myState.size === 'legal' ? '' : 'gray'
								}}>
									11 X 17
								</div>
							</Grid>
							<Grid
								style={{
									height:'30%',
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
										await myTool.makePDF(myState.title, myState.filename, myState.size);
										myTool.isOpen = false;
										myState.title = '';
										myState.filename = 'massmapper.pdf';
										myState.isPrinting = false;
										myState.size = 'letter';
										myTool.deactivate();
									}}
								>
									<Print /> Create PDF
								</Button>
								<Button
									value="Print"
									variant="contained"
									onClick={async () => {
										myTool.isOpen = false;
										myState.isPrinting = false;
										myState.title = '';
										myState.filename = 'massmapper.pdf';
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