import { Domain } from '@ocom/domain';
import type { Models } from '@ocom/data-sources-mongoose-models';
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { ServiceDomainAdapter } from './service.domain-adapter.ts';

type ServiceModelType = Models.Service.Service;
type PropType = ServiceDomainAdapter;

export class ServiceRepository
	extends MongooseSeedwork.MongoRepositoryBase<
		ServiceModelType,
		PropType,
		Domain.Passport,
		Domain.Service.Service<PropType>
	>
	implements Domain.Service.ServiceRepository<PropType>
{
	async getById(id: string): Promise<Domain.Service.Service<PropType>> {
		const mongoService = await this.model.findById(id).exec();
		if (!mongoService) {
			throw new Error(`Service with id ${id} not found`);
		}
		return this.typeConverter.toDomain(mongoService, this.passport);
	}

	getNewInstance(
		serviceName: string,
		description: string,
		community: Domain.Community.CommunityEntityReference,
	): Promise<Domain.Service.Service<PropType>> {
		const adapter = this.typeConverter.toAdapter(new this.model());
		return Promise.resolve(
			Domain.Service.Service.getNewInstance(
				adapter,
				serviceName,
				description,
				community,
				this.passport,
			),
		);
	}
}