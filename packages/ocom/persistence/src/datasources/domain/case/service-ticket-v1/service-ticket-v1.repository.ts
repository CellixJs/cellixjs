import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { Models } from '@ocom/data-sources-mongoose-models';
import { Domain } from '@ocom/domain';
import type { ServiceTicketV1DomainAdapter } from './service-ticket-v1.domain-adapter.ts';

type ServiceTicketModelType = Models.Case.ServiceTicket; // ReturnType<typeof models.Case.ServiceTicketModelFactory> & models.Case.ServiceTicket & { baseModelName: string };
type PropType = ServiceTicketV1DomainAdapter;

export class ServiceTicketV1Repository //<
	//PropType extends Domain.ServiceTicketV1.ServiceTicketV1Props
	//>
	extends MongooseSeedwork.MongoRepositoryBase<
		ServiceTicketModelType,
		PropType,
		Domain.Passport,
		Domain.ServiceTicketV1.ServiceTicketV1<PropType>
	>
	implements Domain.ServiceTicketV1.ServiceTicketV1Repository<PropType>
{
	getNewInstance(
		title: Domain.ServiceTicketV1.ValueObjects.Title,
		description: Domain.ServiceTicketV1.ValueObjects.Description,
		community: Domain.Community.CommunityEntityReference,
		requestor: Domain.Member.MemberEntityReference,
		property?: Domain.Property.PropertyEntityReference,
	): Promise<Domain.ServiceTicketV1.ServiceTicketV1<PropType>> {
		const adapter = this.typeConverter.toAdapter(new this.model());
		return Promise.resolve(
			Domain.ServiceTicketV1.ServiceTicketV1.getNewInstance(
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

	async getById(id: string): Promise<Domain.ServiceTicketV1.ServiceTicketV1<PropType>> {
		const mongoServiceTicket = await this.model.findById(id).exec();
		if (!mongoServiceTicket) {
			throw new Error(`ServiceTicket with id ${id} not found`);
		}
		return this.typeConverter.toDomain(mongoServiceTicket, this.passport);
	}
}