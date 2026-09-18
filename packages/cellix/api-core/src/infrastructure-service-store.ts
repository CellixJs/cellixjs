import type { ServiceBase } from '@cellix/api-services-spec';
import type { ServiceKey } from './types.ts';

/**
 * Internal constructor- and name-keyed store for infrastructure services.
 */
export class InfrastructureServiceStore {
	private readonly byConstructor: Map<ServiceKey<ServiceBase>, ServiceBase> = new Map();
	private readonly byName: Map<string, ServiceBase> = new Map();

	public register<T extends ServiceBase>(service: T, name?: string): void {
		const key = service.constructor as ServiceKey<ServiceBase>;
		if (name == null) {
			if (this.byConstructor.has(key)) {
				throw new Error(`Service already registered for constructor: ${service.constructor.name}`);
			}
			this.byConstructor.set(key, service);
			return;
		}

		if (this.byName.has(name)) {
			throw new Error(`Service name already registered: ${name}`);
		}
		this.byName.set(name, service);
	}

	public get<T extends ServiceBase>(serviceKeyOrName: ServiceKey<T> | string): T {
		if (typeof serviceKeyOrName === 'string') {
			const named = this.byName.get(serviceKeyOrName);
			if (!named) {
				throw new Error(`Service not found: ${serviceKeyOrName}`);
			}
			return named as T;
		}

		const service = this.byConstructor.get(serviceKeyOrName as ServiceKey<ServiceBase>);
		if (!service) {
			const name = (serviceKeyOrName as { name?: string }).name ?? 'UnknownService';
			throw new Error(`Service not found: ${name}`);
		}
		return service as T;
	}

	public unique(): ServiceBase[] {
		const services = new Set<ServiceBase>();
		for (const service of this.byConstructor.values()) {
			services.add(service);
		}
		for (const service of this.byName.values()) {
			services.add(service);
		}
		return [...services];
	}
}
