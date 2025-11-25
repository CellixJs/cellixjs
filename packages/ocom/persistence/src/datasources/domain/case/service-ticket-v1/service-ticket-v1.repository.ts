import { MongooseSeedwork } from '@cellix/mongoose-seedwork';

import type { Passport } from '@ocom/domain';
import type { ServiceTicketV1DomainAdapter } from './service-ticket-v1.domain-adapter.ts';
import type { ServiceTicket } from '@ocom/data-sources-mongoose-models/case/service-ticket';

type ServiceTicketModelType = ServiceTicket;
type PropType = ServiceTicketV1DomainAdapter;

export class ServiceTicketV1Repository //<
	//PropType extends ServiceTicketV1Props
	//>
	extends MongooseSeedwork.MongoRepositoryBase<
		ServiceTicketModelType,
		PropType,
		Passport,
		ServiceTicketV1<PropType>
	>
	implements ServiceTicketV1Repository<PropType>
{
	getNewInstance(
		title: Domain.Contexts.Case.ServiceTicket.V1.ValueObjects.Title,
		description: Domain.Contexts.Case.ServiceTicket.V1.ValueObjects.Description,
		community: CommunityEntityReference,
		requestor: MemberEntityReference,
		property?: PropertyEntityReference,
	): Promise<ServiceTicketV1<PropType>> {
		const adapter = this.typeConverter.toAdapter(new this.model());
		return Promise.resolve(
			ServiceTicketV1.getNewInstance(
				adapter,
				this.passport,
                title,
				description,
				community.id,
				requestor.id,
				property?.id,
			),
		);
	}

	async getById(id: string): Promise<ServiceTicketV1<PropType>> {
		const mongoServiceTicket = await this.model.findById(id).exec();
		if (!mongoServiceTicket) {
			throw new Error(`ServiceTicket with id ${id} not found`);
		}
		return this.typeConverter.toDomain(mongoServiceTicket, this.passport);
	}
}