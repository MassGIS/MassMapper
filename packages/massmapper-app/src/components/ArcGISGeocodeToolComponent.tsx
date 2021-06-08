import XMLParser from 'react-xml-parser';
import {
	Button,
	Dialog,
	DialogTitle,
	Grid,
	TextField,
} from '@material-ui/core'
import {
	ArrowBack,
	Close,
	Explore,
	ImageSearch,
	Search,
} from '@material-ui/icons';
import { latLngBounds, latLng } from 'leaflet';
import { observer, useLocalObservable } from 'mobx-react-lite';
import React, { ChangeEvent, FunctionComponent } from "react";
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
	const results: ArcGISGecodeResult[] = xmlLayers.getElementsByTagName('GeocodeAddressResult').map((o:any) => {
		return {
			address: o.children.filter((c:any) => c.name === 'MatchedAddress')[0].value,
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

	const [mapService] = useService([MapService]);

	if (!myState.isOpen) {
		return (
			<Button
				style={{
					backgroundColor: 'white',
				}}
				color="default"
				variant="contained"
				size="small"
				onClick={() => {
					myState.isOpen = true;
				}}
			>
				<ImageSearch />
			</Button>
		)
	}

	return (
		<Dialog
			open
			onClose={() => {
				myState.isOpen = false;
				myState.city = '';
				myState.zip = '';
				myState.street = '';
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
						}}
						variant="contained"
					>
						<Close /> Close
					</Button>
				</Grid>
			</Grid>
		</Dialog>
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
	return (
		<>
			<Grid
				container
				style={{
					height: '85%',
					marginLeft: '2em'
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
							>
								<Button
									onClick={async () => {
										console.log("zoom to result", r)
										alert("zoom to result");
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