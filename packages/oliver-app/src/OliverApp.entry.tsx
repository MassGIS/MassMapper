import { createBrowserHistory } from 'history';
import React from 'react';
import { render } from 'react-dom';
import { Router, Switch, Route } from 'react-router-dom';
import OliverApp from './OliverApp';
// import 'semantic-ui-less/semantic.less';

const renderTarget = document.getElementById('react-root');
const history = createBrowserHistory();

if (!renderTarget)
	throw new Error('Render target "react-root" not found in page');

render(
	<Router history={history}>
		<Switch>
			<Route component={OliverApp} />
		</Switch>
	</Router>,
	renderTarget
);
