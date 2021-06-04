/// <reference types="google.maps" />
import {
	Button,
	Dialog,
	DialogTitle,
	Grid,
	TextField,
} from '@material-ui/core'
import {
	Search,
	Close,
	ImageSearch
} from '@material-ui/icons';
import { latLngBounds, latLng } from 'leaflet';
import { observer, useLocalObservable } from 'mobx-react-lite';
import React, { ChangeEvent, FunctionComponent } from "react";
import { MapService } from '../services/MapService';
import { useService } from '../services/useService';

const arcgisGeocode = async(search:string):Promise<Array<any>> => {

	//method  : "POST"
	//headers : {'Content-Type':'text/xml; charset=UTF-8'}
	const body = `
	<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
	<soap:Body>
		<GeocodeAddress xmlns="http://tempuri.org/">
			<Address>${search}</Address>
			<City></City>
			<ZipCode></ZipCode>
			<State>MA</State>
		</GeocodeAddress>
	</soap:Body>
	</soap:Envelope>
	`;

	const url = '';
	const res = fetch(url, {
		method : "POST",
		body,
	});

	return [];
}

interface ArcGISGeocodeToolComponentProps {
}

interface ArcGISGeocodeToolComponentState {
	street: string;
	city: string;
	zip: string;
	results: [];
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
				Location Search
			</DialogTitle>
			<Grid
				style={{
					flexGrow: 1,
					height: '40vh',
				}}
			>
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
						value={myState.street}
						placeholder="Address..."
						onChange={(e) => {
							myState.street = e.target.value;
						}}
					/>
					<TextField
						variant="outlined"
						style={{
							width:'80%',
							marginBottom:'.5em',
						}}
						helperText="City or Zip is required"
						value={myState.city}
						placeholder="Town or City..."
						onChange={(e) => {
							myState.city = e.target.value;
						}}
					/>
					<TextField
						variant="outlined"
						style={{
							width:'80%',
							marginBottom:'.5em',
						}}
						helperText="City or Zip is required"
						value={myState.zip}
						placeholder="ZIP Code..."
						onChange={(e) => {
							myState.zip = e.target.value;
						}}
					/>
					<br/>
					<Button
						onClick={() => {
						}}
						disabled={!myState.street || (!myState.city && !myState.zip)}
						variant="contained"
					>
						<Search /> Search
					</Button>
				</Grid>
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

export { ArcGISGeocodeToolComponent }