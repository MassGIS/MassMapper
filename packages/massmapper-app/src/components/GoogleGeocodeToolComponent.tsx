/// <reference types="google.maps" />
import {
	TextField,
} from '@material-ui/core'
import { latLngBounds, latLng } from 'leaflet';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { autorun } from 'mobx';
import { Observer, useLocalObservable } from 'mobx-react-lite';
import React, { FunctionComponent } from "react";
import { MapService } from '../services/MapService';
import { useService } from '../services/useService';


const geocode = new google.maps.Geocoder();
const maBounds = new google.maps.LatLngBounds(
	new google.maps.LatLng(41,-73.5),
	new google.maps.LatLng(43,-70.25)
)
const googleGeocode = async (search:string): Promise<Array<google.maps.GeocoderResult>> => {
	return new Promise<Array<google.maps.GeocoderResult>>((resolve, reject) => {
		geocode.geocode({
			address: search,
			region: "us",
			bounds: maBounds,

		}, (res:Array<google.maps.GeocoderResult> | null) => {
			// resolve(res?.filter(r => r.address_components.filter(p => p.long_name === 'Massachusetts')) || [])
			resolve(res || []);
		})
	})
}

interface GoogleGeocodeToolComponentProps {
}

interface GoogleGeocodeToolComponentState {
	isFocused: boolean;
	searchString: string;
	searchResults: google.maps.GeocoderResult[];
	isSearchLoading: boolean;
	noOptionsText: string;
}

const GoogleGeocodeToolComponent: FunctionComponent<GoogleGeocodeToolComponentProps> = () => {
	const myState = useLocalObservable<GoogleGeocodeToolComponentState>(() => {
		return {
			isFocused: false,
			searchString: '',
			searchResults: [],
			isSearchLoading: false,
			noOptionsText: ''
		}
	});

	const [mapService] = useService([MapService]);

	autorun(async () => {
		if (!myState.searchString || myState.searchString.length < 3) {
			return;
		}

		const res = await googleGeocode(myState.searchString);
		myState.isSearchLoading = false;
		if (res.length === 0) {
			// no results
			myState.noOptionsText = 'No matches found';
		}

		myState.searchResults = res;
	}, {
		delay: 400
	});

	return (
		<Observer>{() =>
			(<div
				style={{
					height: '44px',
					width: myState.isFocused ? '40em' : '15em',
					backgroundColor: 'white',
					padding: '.4em 1em',
					borderRadius: '3px',
				}}
			>
				<Autocomplete
					loading={ myState.isSearchLoading }
					clearOnEscape
					clearOnBlur
					options={ myState.searchResults }
					noOptionsText={myState.noOptionsText}
					getOptionLabel={(o:google.maps.GeocoderResult) => { return o.formatted_address || ''}}
					onFocus={() => {
						myState.isFocused = true;
						window.setTimeout(() => {
							myState.noOptionsText = 'Enter address above...';
						}, 10);
					}}
					onBlur={(e) => {
						myState.isFocused = false;
						myState.isSearchLoading = false;
						myState.noOptionsText = '';
						myState.searchResults = [];
					}}
					onKeyUp={(e) => {
						const val = (e.target as HTMLInputElement).value;
						if (val.length > 3) {
							myState.isSearchLoading = true;
						}
						myState.searchString = val;
					}}
					filterOptions={(o) => {
						return o;
					}}
					// onchange only fires on actually *selecting* an option
					onChange={(e,v) => {
						if (!v) {
							myState.searchResults = [];
							myState.searchString = '';
							return;
						}
						if (v.geometry.bounds) {
							const gBounds = v.geometry.bounds!;
							const bounds = latLngBounds(
								latLng(gBounds.getNorthEast().lat(),
									gBounds.getNorthEast().lng()),
								latLng(gBounds.getSouthWest().lat(),
									gBounds.getSouthWest().lng()),
							)
							mapService.leafletMap?.fitBounds(bounds);
						} else if (v.geometry.location) {
							const center = latLng(v.geometry.location.lat(), v.geometry.location.lng());
							mapService.leafletMap?.panTo(center)
							mapService.leafletMap?.setZoom(19);
						}
					}}
					renderInput={(params) => (
						<TextField
							{...params}
							style={{
								width: '100%'
							}}
							placeholder={myState.isFocused ? '' : 'Enter a location...'}
						/>
					)}
				/>

			</div>)
		}</Observer>

	);
};

export { GoogleGeocodeToolComponent }