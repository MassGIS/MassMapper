import { useContext } from 'react';
import { Token } from 'typedi';
import { ServiceContext } from './ServiceContext';

type ServiceType<T> =
	| string
	| Token<T>
	| {
		service: T;
	  };

function useService<T1>(serviceType: ServiceType<T1>): T1;
function useService<T1>(serviceType: [ServiceType<T1>]): [T1];
function useService<T1, T2>(serviceType: [ServiceType<T1>, ServiceType<T2>]): [T1, T2];
function useService<T1, T2, T3>(serviceType: [ServiceType<T1>, ServiceType<T2>, ServiceType<T3>]): [T1, T2, T3];
function useService<T1, T2, T3, T4>(serviceType: [ServiceType<T1>, ServiceType<T2>, ServiceType<T3>, ServiceType<T4>]): [T1, T2, T3, T4];
function useService<T1, T2, T3, T4, T5>(
	serviceType: [ServiceType<T1>, ServiceType<T2>, ServiceType<T3>, ServiceType<T4>, ServiceType<T5>]
): [T1, T2, T3, T4, T5];
function useService(serviceType: any | any[]): any {
	const { services } = useContext(ServiceContext);

	const types = Array.isArray(serviceType) ? serviceType : [serviceType];
	const instances = [];

	for (const type of types) {
		const service = services.get(type as any);

		if (!service) throw new Error(`Dependency injection container could not resolve service: '${type}'.`);

		instances.push(services.get(type as any));
	}

	return Array.isArray(serviceType) ? instances : instances[0];
}

export { useService };
