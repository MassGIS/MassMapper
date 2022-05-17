import XMLParser from 'react-xml-parser';
import {
	TextField,
	Paper,
} from '@material-ui/core'
import { latLng } from 'leaflet';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { autorun } from 'mobx';
import { Observer, useLocalObservable } from 'mobx-react-lite';
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

interface ArcGISGeocodeToolComponentProps {
}

interface ArcGISGeocodeToolComponentState {
	isFocused: boolean;
	searchString: string;
	searchResults: ArcGISGecodeResult[];
	isSearchLoading: boolean;
	noOptionsText: string;
	inputValue: string;
}

const ArcGISGeocodeToolComponent: FunctionComponent<ArcGISGeocodeToolComponentProps> = () => {
	const myState = useLocalObservable<ArcGISGeocodeToolComponentState>(() => {
		return {
			isFocused: false,
			searchString: '',
			searchResults: [],
			isSearchLoading: false,
			noOptionsText: '',
			inputValue: '',
		}
	});

	const [mapService] = useService([MapService]);

	autorun(async () => {
		if (!myState.searchString || myState.searchString.length < 3) {
			return;
		}

		const res = await arcgisGeocode(myState.searchString);
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
			(<Paper
				elevation={2}
			>
				<div
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
						getOptionLabel={(o:ArcGISGecodeResult) => { return o.address || ''}}
						inputValue={myState.inputValue}
						onFocus={() => {
							myState.isFocused = true;
							window.setTimeout(() => {
								myState.noOptionsText = 'Enter address above...';
							}, 10);
						}}
						onInputChange={(e, val) => {
							myState.inputValue = val;
						}}
						onBlur={(e) => {
							myState.isFocused = false;
							myState.isSearchLoading = false;
							myState.noOptionsText = '';
							myState.searchResults = [];
							myState.inputValue = '';
						}}
						onKeyUp={(e) => {
							const val = (e.target as HTMLInputElement).value;
							if (/enter/i.test(e.code)) {
								myState.isSearchLoading = true;
								myState.searchString = val;
							}
							else if (!/arrow/i.test(e.code)) {
								myState.isSearchLoading = false;
								myState.searchResults = [];
							}
						}}
						filterOptions={(o) => {
							return o;
						}}
						// onchange only fires on actually *selecting* an option
						onChange={(e,v:any) => {
							if (!v) {
								myState.searchResults = [];
								myState.searchString = '';
								return;
							}
							mapService.leafletMap?.setView(latLng(v.location.y, v.location.x), 19);
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

				</div>
			</Paper>)
		}</Observer>

	);
};

export { ArcGISGeocodeToolComponent }