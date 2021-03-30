import { observer, Observer } from 'mobx-react';
import queryString from 'query-string';
import React, { FunctionComponent, useContext, useEffect } from 'react';
import { RouteComponentProps, withRouter } from 'react-router';

import './OliverApp.module.css';
import { useService } from './services/useService';
import { ServiceContext, ServiceContextType } from './services/ServiceContext';
import { LegendService, Layer } from './services/LegendService';
import { ContainerInstance, ServiceNotFoundError } from 'typedi';

// import logo from '../assets/img/logo.png';
// import timeIcon from '../assets/img/time-icon.png';
// import saltIcon from '../assets/img/salt-icon.png';
// import snowIcon from '../assets/img/snow-icon.png';
// import vehicleIcon from '../assets/img/vehicle-icon.png';


interface OliverAppProps extends RouteComponentProps<any> {}
const OliverApp: FunctionComponent<OliverAppProps> = observer(() => {

	const { services } = useContext(ServiceContext);

	if (!services.has(typeof LegendService)) {
		const ls = new LegendService();
		loadSomeLayers(ls);
		services.set(typeof LegendService, ls);
	}

	const legendService = useService(typeof LegendService) as LegendService;
	window['legendService'] = legendService;

	if (!legendService.ready) {
		return (<>Loading...</>);
	}

	return (
		<div styleName="container">
			<div styleName="nav">
				Nav Bar
			</div>
			<div styleName="right">
				{legendService.layers.map((l) => (
					<div
						key={`layer-${l.id}`}
					>
						<input
							type="checkbox"
							onClick={() => {
								l.enabled = !l.enabled;
							}}
							checked={l.enabled}
						/>
						<label>{l.name}</label>
					</div>
				))}
			</div>
			<div styleName="main">
				<div>Enabled Layers:</div>
				{legendService.enabledLayers.map((l) => (
					<div
						key={`layer-${l.id}`}
					>
						{l.name}
					</div>
				))}
			</div>
		</div>
	);
});

const loadSomeLayers = (legendService:LegendService) => {
	[{
		name: "test",
		id: "test-id",
		enabled: true,
	},
	{
		name: "another test",
		id: "test-2",
		enabled: true,
	},
	{
		name: "layer 3",
		id: "test-3",
		enabled: true,
	},
	{
		name: "layer d",
		id: "test-4",
		enabled: true,
	}].forEach((l:Layer) => {
		legendService.addLayer(l);
	})
}


export default withRouter(OliverApp);