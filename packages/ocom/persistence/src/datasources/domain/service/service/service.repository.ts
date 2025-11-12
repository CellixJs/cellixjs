import { Passport } from '@ocom/domain';
import type { Models } from '@ocom/data-sources-mongoose-models';
import * as MongooseSeedwork from '@cellix/mongoose-seedwork';
import type { ServiceDomainAdapter } from './service.domain-adapter.ts';

type ServiceModelType = Models.Service.Service;
type PropType = ServiceDomainAdapter;

export class ServiceRepository
	extends MongooseSeedwork.MongoRepositoryBase<
		ServiceModelType,
		PropType,
		Domain.Passport,
		Domain.Contexts.Service.Service.Service<PropType>
	>
	implements Domain.Contexts.Service.Service.ServiceRepository<PropType>
{
	async getById(id: string): Promise<Domain.Contexts.Service.Service.Service<PropType>> {
		const mongoService = await this.model.findById(id).exec();
		if (!mongoService) {
			throw new Error(`Service with id ${id} not found`);
		}
		return this.typeConverter.toDomain(mongoService, this.passport);
	}

	getNewInstance(
		serviceName: string,
		description: string,
		community: Domain.Contexts.Community.Community.CommunityEntityReference,
	): Promise<Domain.Contexts.Service.Service.Service<PropType>> {
		const adapter = this.typeConverter.toAdapter(new this.model());
		return Promise.resolve(
			Domain.Contexts.Service.Service.Service.getNewInstance(
				adapter,
				serviceName,
				description,
				community,
				this.passport,
			),
		);
	}
}