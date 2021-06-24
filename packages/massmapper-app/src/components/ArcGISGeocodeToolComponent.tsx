import XMLParser from 'react-xml-parser';
import {
	Button,
	Dialog,
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
import { latLng } from 'leaflet';
import { observer, useLocalObservable } from 'mobx-react-lite';
import React, { FunctionComponent } from "react";
import { MapService } from '../services/MapService';
import { useService } from '../services/useService';

interface ArcGISGecodeResult {
	address: string;
	location: {
		x: number,
		y: number,
	}
};

const arcgisGeocode = async(addr:string, city?: string, zip?: string):Promise<Array<ArcGISGecodeResult>> => {

	//method  : "POST"
	//headers : {'Content-Type':'text/xml; charset=UTF-8'}
	const body = `<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
<soap:Body>
<GeocodeAddress xmlns="http://tempuri.org/">
<Address>${addr}</Address>
<City>${city || ''}</City>
<ZipCode>${zip || ''}</ZipCode>
<State>MA</State>
</GeocodeAddress>
</soap:Body>
</soap:Envelope>`;

	const proxy = 'https://massgis.2creek.com/cgi-bin/proxy.cgi'
	const url = 'http://gisprpxy.itd.state.ma.us/MassGISGeocodeServiceApplication/MassGISCustomGeocodeService.asmx';
	const res = await fetch(proxy + "?url=" + url, {
		method : "POST",
		headers: {
			'Content-Type':'text/xml; charset=UTF-8'
		},
		body,
	});

	// response like:
	// const resXML = `<soap:Envelope>
	// <soap:Body>
	// <GeocodeAddressResponse xmlns="http://tempuri.org/">
	// <GeocodeAddressResult>
	// <X>183509.55501775382</X><Y>895885.57799501845</Y><MatchedAddress>17 HUNTER CIRCLE, SHREWSBURY, MA, 01545</MatchedAddress><Score>100</Score>
	// </GeocodeAddressResult>
	// </GeocodeAddressResponse></soap:Body></soap:Envelope>`;

	const resXML = await res.text();
	if (!resXML) {
		return [];
	}


	const xmlLayers = new XMLParser().parseFromString(resXML);
	const results: ArcGISGecodeResult[] = xmlLayers.getElementsByTagName('GeocodeAddressResult')
		.filter((o:any) => o.children.filter((c:any) => c.name === 'MatchedAddress').length > 0)
		.map((o:any) => {
			const addrChildren = o.children.filter((c:any) => c.name === 'MatchedAddress')
			return {
				address: addrChildren[0].value,
				location: {
					x: o.children.filter((c:any) => c.name === 'X')[0].value,
					y: o.children.filter((c:any) => c.name === 'Y')[0].value,
				}
			} as ArcGISGecodeResult;
		});

	return results;
}

interface ArcGISGeocodeToolComponentProps {
}

interface ArcGISGeocodeToolComponentState {
	street: string;
	city: string;
	zip: string;
	results: Array<ArcGISGecodeResult>;
	isOpen: boolean;
}

const ArcGISGeocodeToolComponent: FunctionComponent<ArcGISGeocodeToolComponentProps> = observer(() => {
	const myState = useLocalObservable<ArcGISGeocodeToolComponentState>(() => {
		return {
			street: '',
			city: '',
			zip: '',
			results: [],
			isOpen: false,
		}
	});

	return (
		<>
			<Button
				style={{
					backgroundColor: 'white',
				}}
				color="default"
				variant="contained"
				size="small"
				title="Search and zoom to an address"
				onClick={() => {
					myState.isOpen = true;
				}}
			>
				<ImageSearch />
			</Button>
			{myState.isOpen && (
				<Dialog
					open
					onClose={() => {
						myState.isOpen = false;
						myState.city = '';
						myState.zip = '';
						myState.street = '';
						myState.results = [];
					}}
				>
					<DialogTitle>
						{myState.results.length > 0 ? 'Search Results' : 'Location Search'}
					</DialogTitle>
					<Grid
						style={{
							flexGrow: 1,
							height: '40vh',
						}}
					>
						{myState.results.length > 0 && (<ResultsComponent uiState={myState} />)}
						{myState.results.length === 0 && (<SearchComponent uiState={myState} />)}
						<Grid
							style={{
								height: '15%',
								textAlign: 'center'
							}}
						>
							<Button
								onClick={() => {
									myState.isOpen = false;
									myState.city = '';
									myState.zip = '';
									myState.street = '';
									myState.results = [];
								}}
								variant="contained"
							>
								<Close /> Close
							</Button>
						</Grid>
					</Grid>
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
				helperText="Address is required"
				value={uiState.street}
				placeholder="Address..."
				onChange={(e) => {
					uiState.street = e.target.value;
				}}
			/>
			<TextField
				variant="outlined"
				style={{
					width:'80%',
					marginBottom:'.5em',
				}}
				helperText="City or Zip is required"
				value={uiState.city}
				placeholder="Town or City..."
				onChange={(e) => {
					uiState.city = e.target.value;
				}}
			/>
			<TextField
				variant="outlined"
				style={{
					width:'80%',
					marginBottom:'.5em',
				}}
				helperText="City or Zip is required"
				value={uiState.zip}
				placeholder="ZIP Code..."
				onChange={(e) => {
					uiState.zip = e.target.value;
				}}
			/>
			<br/>
			<Button
				onClick={async () => {
					uiState.results = await arcgisGeocode(uiState.street, uiState.city, uiState.zip);
					if (uiState.results.length === 0) {
						alert("No matches found.  Please try again.");
					}
				}}
				disabled={!uiState.street || (!uiState.city && !uiState.zip)}
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
										mapService.leafletMap?.setZoom(19);
										// have to give it time to get to the right zoom, I guess
										window.setTimeout(() => {
											mapService.leafletMap?.panTo(center);
											uiState.isOpen = false;
											uiState.city = '';
											uiState.zip = '';
											uiState.street = '';
											uiState.results = [];
										}, 500)
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