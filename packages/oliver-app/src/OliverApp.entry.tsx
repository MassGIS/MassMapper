import React from 'react';
import { render } from 'react-dom';
import { ErrorBoundary } from '@peoplegis/ui';
import { Router, Switch, Route } from 'react-router-dom';
import { history } from '@peoplegis/framework';
import PublicPortal from './components/Portal.container';
import 'semantic-ui-less/semantic.less';

const renderTarget = document.getElementById('react-root');

if (!renderTarget)
	throw new Error('Render target "react-root" not found in page');

render(
	<ErrorBoundary>
		<Router history={history}>
			<Switch>
				<Route component={PublicPortal} />
			</Switch>
		</Router>
	</ErrorBoundary>,
	renderTarget
);
