import type { Models } from '@ocom/data-sources-mongoose-models';
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { ServiceDomainAdapter } from './service.domain-adapter.ts';
import type { CommunityEntityReference } from '@ocom/domain/contexts/community';
import type { Service, ServiceRepository } from '@ocom/domain/contexts/service';
import type { Passport } from '@ocom/domain/contexts/passport';
// Runtime import for class constructor
import { Service as ServiceClass } from '@ocom/domain/contexts/service';

type ServiceModelType = Models.Service;
type PropType = ServiceDomainAdapter;

export class ServiceRepository
	extends MongooseSeedwork.MongoRepositoryBase<
		ServiceModelType,
		PropType,
		Passport,
		Service<PropType>
	>
	implements ServiceRepository<PropType>
{
	async getById(id: string): Promise<Service<PropType>> {
		const mongoService = await this.model.findById(id).exec();
		if (!mongoService) {
			throw new Error(`Service with id ${id} not found`);
		}
		return this.typeConverter.toDomain(mongoService, this.passport);
	}

	getNewInstance(
		serviceName: string,
		description: string,
		community: CommunityEntityReference,
	): Promise<Service<PropType>> {
		const adapter = this.typeConverter.toAdapter(new this.model());
		return Promise.resolve(
			ServiceClass.getNewInstance(
				adapter,
				serviceName,
				description,
				community,
				this.passport,
			),
		);
	}
}