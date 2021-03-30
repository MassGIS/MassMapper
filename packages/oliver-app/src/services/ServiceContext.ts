import { createContext } from 'react';
import { v4 as uuid } from 'uuid';
import { Container, ContainerInstance } from 'typedi';

interface ServiceContextType {
	services: ContainerInstance;
}

const ServiceContext = createContext<ServiceContextType>({
	services: Container.of(uuid()),
});

export { ServiceContext, ServiceContextType };
