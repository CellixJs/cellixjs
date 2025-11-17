import type { DataSources } from '@ocom/persistence';
import { create } from './create.ts';
import type { ServiceCreateCommand } from './create.ts';
import type * as Service from '@ocom/domain/contexts/service';

export interface ServiceApplicationService {
	create: (
		command: ServiceCreateCommand,
	) => Promise<Service.ServiceEntityReference>;
}

export const Service = (
	dataSources: DataSources,
): ServiceApplicationService => {
	return {
		create: create(dataSources),
	};
};