import { createContext } from 'react';
import { Container, ContainerInstance } from 'typedi';
import { v4 as uuid } from 'uuid';

interface ServiceContextType {
	services: ContainerInstance;
}

const ServiceContext = createContext<ServiceContextType>({
	services: Container.of(uuid()),
});

export { ServiceContext, ServiceContextType };
