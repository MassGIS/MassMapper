import XMLParser from 'react-xml-parser';
import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Grid,
	TextField,
} from '@material-ui/core'
import proj4 from 'proj4';
import {
	Close,
	Explore,
	ImageSearch,
	Search,
} from '@material-ui/icons';
import { makeStyles } from '@material-ui/core/styles';
import { latLng } from 'leaflet';
import { observer, useLocalObservable } from 'mobx-react-lite';
import React, { FunctionComponent } from "react";
import { MapService } from '../services/MapService';
import { useService } from '../services/useService';
import { toast } from 'react-toastify';
import { Tool, ToolComponentProps } from '../models/Tool';

interface ArcGISGecodeResult {
	address: string;
	location: {
		x: number,
		y: number,
	}
};

const arcgisGeocode = async(addr:string):Promise<Array<ArcGISGecodeResult>> => {

	//method  : "POST"
	//headers : {'Content-Type':'text/xml; charset=UTF-8'}
	const body = `<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
	<soap:Body>
	<GeocodeAddressSingleField xmlns="http://tempuri.org/">
	<fullAddressOrPOI>${addr}</fullAddressOrPOI>
	</GeocodeAddressSingleField>
	</soap:Body>
	</soap:Envelope>`;

	const proxy = 'https://maps.massgis.digital.mass.gov/cgi-bin/proxy.cgi'
	const url = 'https://arcgisserver.digital.mass.gov/MassGISMassMapperGeocodeServiceApplication/MassGISCustomGeocodeService.asmx';
	const res = await fetch(proxy + "?url=" + url, {
		method : "POST",
		headers: {
			'Content-Type':'text/xml; charset=UTF-8'
		},
		body,
	});

	// response like:
	// <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
	// <soap:Body>
	// <GeocodeAddressSingleFieldResponse xmlns="http://tempuri.org/">
	// <GeocodeAddressSingleFieldResult>
	// <X>219456.75587901549</X>
	// <Y>871381.40819348907</Y>
	// <MatchedAddressOrPOI>GILLETTE STADIUM, FOXBOROUGH</MatchedAddressOrPOI>
	// <Score>99.9</Score>
	// <Lat>42.092601423627414</Lat>
	// <Long>-71.264809494076175</Long>
	// </GeocodeAddressSingleFieldResult>
	// </GeocodeAddressSingleFieldResponse>
	// </soap:Body>
	// </soap:Envelope>

	const resXML = await res.text();
	if (!resXML) {
		return [];
	}


	const xmlLayers = new XMLParser().parseFromString(resXML);
	const results: ArcGISGecodeResult[] = xmlLayers.getElementsByTagName('GeocodeAddressSingleFieldResult')
		.filter((o:any) => o.children.filter((c:any) => c.name === 'MatchedAddressOrPOI').length > 0)
		.map((o:any) => {
			const addrChildren = o.children.filter((c:any) => c.name === 'MatchedAddressOrPOI')
			return {
				address: addrChildren[0].value,
				location: {
					x: o.children.filter((c:any) => c.name === 'Long')[0].value,
					y: o.children.filter((c:any) => c.name === 'Lat')[0].value,
				}
			} as ArcGISGecodeResult;
		});

	return results.filter(o => {
		return o.location.x !== NaN && o.location.y !== NaN;
	});
}

const useStyles = makeStyles((theme) => ({
	paper: {
		'& .MuiPaper-root': {
			height: '35vh',
			width: '90vw',
			pointerEvents: 'auto'
		},
		'&' : {
			pointerEvents: 'none'
		}
	},
}));

interface ArcGISGeocodeToolComponentState {
	street: string;
	results: Array<ArcGISGecodeResult>;
	tool: Tool;
}

const ArcGISGeocodeToolComponent: FunctionComponent<ToolComponentProps> = observer(({tool}) => {
	const myState = useLocalObservable<ArcGISGeocodeToolComponentState>(() => {
		return {
			street: '',
			results: [],
			tool,
		}
	});

	const classes = useStyles();

	return (
		<>
			<Button
				style={{
					minWidth: '32px',
					backgroundColor: tool.isActive ? '' : 'white',
				}}
				color="default"
				variant="contained"
				size="small"
				title="Search and zoom to an address"
				onClick={() => {
					tool.activate();
				}}
			>
				<ImageSearch />
			</Button>
			{tool.isActive && (
				<Dialog
					open
					className={classes.paper}
					onClose={() => {
						myState.street = '';
						myState.results = [];
						tool.deactivate();
					}}
					BackdropProps={{
						invisible: true
					}}
				>
					<DialogActions>
						<Button
							size="small"
							style={{
								float: 'right'
							}}
							onClick={() => {
								myState.street = '';
								myState.results = [];
								tool.deactivate();
							}}
						>
							<Close />
						</Button>
					</DialogActions>
					<DialogTitle>
						{myState.results.length > 0 ? 'Search Results' : 'Location Search'}
					</DialogTitle>
					<DialogContent
						style={{
							overflowY: 'hidden'
						}}
					>
						<Grid
							style={{
								flexGrow: 1,
								height: '40vh',
							}}
						>
							{myState.results.length > 0 && (<ResultsComponent uiState={myState} />)}
							{myState.results.length === 0 && (<SearchComponent uiState={myState} />)}
						</Grid>
					</DialogContent>
				</Dialog>
			)}
		</>
	);
});

const SearchComponent: FunctionComponent<{uiState: ArcGISGeocodeToolComponentState}> = observer(({uiState}) => {
	return (
		<Grid
			style={{
				height: '85%',
				marginLeft: '2em'
			}}
		>
			<TextField
				variant="outlined"
				style={{
					width:'80%',
					marginBottom:'.5em',
				}}
				value={uiState.street}
				placeholder="Find address or place"
				onChange={(e) => {
					uiState.street = e.target.value;
				}}
			/>
			<br/>
			<Button
				onClick={async () => {
					uiState.results = await arcgisGeocode(uiState.street);
					if (uiState.results.length === 0) {
						toast("No matches found.  Please try again.");
					}
				}}
				disabled={!uiState.street}
				variant="contained"
			>
				<Search /> Search
			</Button>
		</Grid>
	)
});


const ResultsComponent: FunctionComponent<{uiState: ArcGISGeocodeToolComponentState}> = observer(({uiState}) => {
	const mapService = useService(MapService);
	return (
		<>
			<Grid
				container
				direction="row"
				style={{
					height: '85%',
					padding: '0 2em',
				}}
			>
				<Grid
					container
					direction="row"
					style={{
						marginBottom: '1em'
					}}
				>
					{uiState.results.map((r) => {
						return (
							<Grid
								item
								style={{
									height: '1.4em'
								}}
								key={Math.random()}
							>
								<Button
									onClick={async () => {
										const spMeters = "+proj=lcc +lat_1=42.68333333333333 +lat_2=41.71666666666667 +lat_0=41 +lon_0=-71.5 +x_0=200000 +y_0=750000 +ellps=GRS80 +datum=NAD83 +units=m +no_defs";
										// const spFeet = "+proj=lcc +lat_1=42.68333333333333 +lat_2=41.71666666666667 +lat_0=41 +lon_0=-71.5 +x_0=200000.0001016002 +y_0=750000 +ellps=GRS80 +datum=NAD83 +to_meter=0.3048006096012192 +no_defs"
										const pt = proj4(spMeters).inverse([Math.round(r.location.x), Math.round(r.location.y)]);
										const center = latLng(pt[1], pt[0]);
										mapService.leafletMap?.setView(center, 19);
										uiState.street = '';
										uiState.results = [];
										uiState.tool.deactivate()
									}}
									variant="contained"
								>
									<Explore />
								</Button>
								&nbsp;&nbsp;
								{r.address}
							</Grid>
						)
					})}
				</Grid>
				{/* <Grid item>
					<Button
						onClick={async () => {
							uiState.results = [];
						}}
						variant="contained"
					>
						<ArrowBack /> Back
					</Button>
				</Grid> */}
			</Grid>
		</>
	)
});

export { ArcGISGeocodeToolComponent }
