import { CssBaseline } from '@material-ui/core';
import { ThemeProvider } from '@material-ui/core/styles';
import { configure } from 'mobx';
import React, { FunctionComponent } from 'react';
import { render } from 'react-dom';
import { Router, Switch, Route } from 'react-router-dom';
import 'reflect-metadata';
import OliverApp from './MassMapperApp';
import { ServiceProvider } from './services/ServiceProvider';
import { history } from './services/HistoryService';
import theme from './theme';
import "fontsource-roboto/300.css";
import "fontsource-roboto/400.css";
import "fontsource-roboto/500.css";
import "fontsource-roboto/700.css";
import "fontsource-roboto/300-italic.css";
import "fontsource-roboto/400-italic.css";
import "fontsource-roboto/500-italic.css";
import "fontsource-roboto/700-italic.css";

const renderTarget = document.getElementById('react-root');

if (!renderTarget) {
	throw new Error('Render target "react-root" not found in page');
}

configure({ useProxies: "always" });

const App: FunctionComponent = () => (
	<ServiceProvider>
		<ThemeProvider theme={theme}>
			<CssBaseline />
			<OliverApp/>
		</ThemeProvider>
	</ServiceProvider>
);

render(
	<Router history={history}>
		<Switch>
			<Route component={App}/>
		</Switch>
	</Router>,
	renderTarget
);
