import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import { create } from './create.ts';
import type { ServiceCreateCommand } from './create.ts';

export interface ServiceApplicationService {
	create: (
		command: ServiceCreateCommand,
	) => Promise<Domain.Contexts.Service.Service.ServiceEntityReference>;
}

export const Service = (
	dataSources: DataSources,
): ServiceApplicationService => {
	return {
		create: create(dataSources),
	};
};