import { observer, Observer } from 'mobx-react';
import queryString from 'query-string';
import React, { FunctionComponent, useContext, useEffect } from 'react';
import { RouteComponentProps, withRouter } from 'react-router';

import './OliverApp.module.css';
import { useService } from './services/useService';
import { ServiceContext, ServiceContextType } from './services/ServiceContext';
import { LegendService } from './services/LegendService';
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
		services.set(typeof LegendService, new LegendService());
	}

	const legendService = useService(typeof LegendService) as LegendService;

	if (!legendService.ready) {
		return (<>Loading...</>);
	}

	return (
		<div styleName="container">
			<div styleName="nav">
				Nav Bar
			</div>
			<div styleName="right">
				Right Panel
			</div>
			<div styleName="main">
				Map Panel
			</div>
		</div>
	);
});



export default withRouter(OliverApp);