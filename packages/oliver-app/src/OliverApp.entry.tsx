import { createBrowserHistory } from 'history';
import React, { FunctionComponent } from 'react';
import { render } from 'react-dom';
import { Router, Switch, Route } from 'react-router-dom';
import OliverApp from './OliverApp';
import { ServiceProvider } from './services/ServiceProvider';
import { history } from './services/HistoryService';
// import 'semantic-ui-less/semantic.less';

const renderTarget = document.getElementById('react-root');

if (!renderTarget)
	throw new Error('Render target "react-root" not found in page');

const EntryComponent: FunctionComponent = () => (
	<ServiceProvider>
		<OliverApp />
	</ServiceProvider>
);

render(
	<Router history={history}>
		<Switch>
			<Route component={EntryComponent} />
		</Switch>
	</Router>,
	renderTarget
);
