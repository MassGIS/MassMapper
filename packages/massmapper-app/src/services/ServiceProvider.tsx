import React, { Component } from 'react';
import { Container } from 'typedi';
import { v4 as uuid } from 'uuid';
import { HistoryService } from './HistoryService';
import { ServiceContext } from './ServiceContext';

type ServiceProviderProps = {};

class ServiceProvider extends Component<ServiceProviderProps> {
	private readonly services = Container.of(uuid());

	constructor(props: ServiceProviderProps) {
		super(props);

		this.services.set(HistoryService, new HistoryService());
	}

	public render(): JSX.Element | null {
		const { children } = this.props;

		return <ServiceContext.Provider value={{ services: this.services }}>{children}</ServiceContext.Provider>;
	}
}

export { ServiceProvider };
