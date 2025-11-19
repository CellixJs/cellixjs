import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { Models } from '@ocom/data-sources-mongoose-models';
import type { ServiceTicketV1DomainAdapter } from './service-ticket-v1.domain-adapter.ts';
import type { CommunityEntityReference } from '@ocom/domain/contexts/community';
import type { MemberEntityReference } from '@ocom/domain/contexts/member';
import type { PropertyEntityReference } from '@ocom/domain/contexts/property';
import type { ServiceTicketV1, ServiceTicketV1Props, ServiceTicketV1Repository } from '@ocom/domain/contexts/service-ticket/v1';
import { ServiceTicketV1 as ServiceTicketV1Class } from '@ocom/domain/contexts/service-ticket/v1';
import type { Passport } from '@ocom/domain/contexts/passport';

type ServiceTicketModelType = Models.Case.ServiceTicket; // ReturnType<typeof models.Case.ServiceTicketModelFactory> & models.Case.ServiceTicket & { baseModelName: string };
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
		title: ServiceTicketV1.ValueObjects.Title,
		description: ServiceTicketV1.ValueObjects.Description,
		community: CommunityEntityReference,
		requestor: MemberEntityReference,
		property?: PropertyEntityReference,
	): Promise<ServiceTicketV1<PropType>> {
		const adapter = this.typeConverter.toAdapter(new this.model());
		return Promise.resolve(
			ServiceTicketV1Class.getNewInstance(
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