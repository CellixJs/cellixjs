import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { Models } from '@ocom/data-sources-mongoose-models';
import { Domain } from '@ocom/domain';
import type { ServiceTicketV1DomainAdapter } from './service-ticket-v1.domain-adapter.ts';

type ServiceTicketModelType = Models.Case.ServiceTicket; // ReturnType<typeof models.Case.ServiceTicketModelFactory> & models.Case.ServiceTicket & { baseModelName: string };
type PropType = ServiceTicketV1DomainAdapter;

export class ServiceTicketV1Repository //<
	//PropType extends Domain.Contexts.Case.ServiceTicket.V1.ServiceTicketV1Props
	//>
	extends MongooseSeedwork.MongoRepositoryBase<
		ServiceTicketModelType,
		PropType,
		Domain.Passport,
		Domain.Contexts.Case.ServiceTicket.V1.ServiceTicketV1<PropType>
	>
	implements Domain.Contexts.Case.ServiceTicket.V1.ServiceTicketV1Repository<PropType>
{
	getNewInstance(
		title: string,
		description: string,
		community: Domain.Contexts.Community.Community.CommunityEntityReference,
		requestor: Domain.Contexts.Community.Member.MemberEntityReference,
		property?: Domain.Contexts.Property.Property.PropertyEntityReference,
	): Promise<Domain.Contexts.Case.ServiceTicket.V1.ServiceTicketV1<PropType>> {
		const adapter = this.typeConverter.toAdapter(new this.model());
		return Promise.resolve(
			Domain.Contexts.Case.ServiceTicket.V1.ServiceTicketV1.getNewInstance(
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

	async getById(id: string): Promise<Domain.Contexts.Case.ServiceTicket.V1.ServiceTicketV1<PropType>> {
		const mongoServiceTicket = await this.model.findById(id).exec();
		if (!mongoServiceTicket) {
			throw new Error(`ServiceTicket with id ${id} not found`);
		}
		return this.typeConverter.toDomain(mongoServiceTicket, this.passport);
	}
}