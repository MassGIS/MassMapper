import { observer, Observer } from 'mobx-react';
// import DevTools from 'mobx-react-devtools';
import queryString from 'query-string';
import React from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
// import { Tab, TabPaneProps } from 'semantic-ui-react';
// import { Container } from 'typedi';

// import PortalService from '../services/PortalService';

// import './Portal.module.css';

// import logo from '../assets/img/logo.png';
// import timeIcon from '../assets/img/time-icon.png';
// import saltIcon from '../assets/img/salt-icon.png';
// import snowIcon from '../assets/img/snow-icon.png';
// import vehicleIcon from '../assets/img/vehicle-icon.png';


interface OliverAppProps extends RouteComponentProps<any> {}
@observer
class OliverApp extends React.Component<
	OliverAppProps
> {
	constructor(props: OliverAppProps) {
		super(props);
		// Container.of(this).set(PortalService, new PortalService());
	}

	public shouldComponentUpdate(nextProps: OliverAppProps) {
		const qs = queryString.parse(this.props.location.search);
		const newQs = queryString.parse(nextProps.location.search);

		return qs.sid !== newQs.sid || qs.config_id !== newQs.config_id;
	}

	public render() {
		// const ps = Container.of(this).get(PortalService);
		// if (!ps.ready) {
		// 	return (<span>Loading...</span>);
		// }

		return (
			<>
				The New OLIVER!!!
			</>
		);
	}
}



export default withRouter(OliverApp);