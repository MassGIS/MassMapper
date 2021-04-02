import React, { FunctionComponent } from 'react';
import { render } from 'react-dom';
import { Router, Switch, Route } from 'react-router-dom';
import 'reflect-metadata';
import OliverApp from './OliverApp';
import { ServiceProvider } from './services/ServiceProvider';
import { history } from './services/HistoryService';
import "fontsource-roboto/300.css";
import "fontsource-roboto/400.css";
import "fontsource-roboto/500.css";
import "fontsource-roboto/700.css";
import "fontsource-roboto/300-italic.css";
import "fontsource-roboto/400-italic.css";
import "fontsource-roboto/500-italic.css";
import "fontsource-roboto/700-italic.css";

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
