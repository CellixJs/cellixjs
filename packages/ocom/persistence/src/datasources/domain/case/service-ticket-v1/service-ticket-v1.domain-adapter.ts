import type { DomainSeedwork } from '@cellix/domain-seedwork';
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { Models } from '@ocom/data-sources-mongoose-models';
import { Domain } from '@ocom/domain';
import { MemberDomainAdapter } from '../../community/member/member.domain-adapter.ts';

export class ServiceTicketV1Converter extends MongooseSeedwork.MongoTypeConverter<
	Models.Case.ServiceTicket,
	ServiceTicketV1DomainAdapter,
	Domain.Passport,
	Domain.Contexts.Case.ServiceTicket.V1.ServiceTicketV1<ServiceTicketV1DomainAdapter>
> {
	constructor() {
		super(
			ServiceTicketV1DomainAdapter,
			Domain.Contexts.Case.ServiceTicket.V1.ServiceTicketV1
		);
	}
}

export class ServiceTicketV1DomainAdapter
	extends MongooseSeedwork.MongooseDomainAdapter<Models.Case.ServiceTicket>
	implements Domain.Contexts.Case.ServiceTicket.V1.ServiceTicketV1Props
{
	get title(): string {
		return this.doc.title;
	}
	set title(title: string) {
		this.doc.title = title;
	}

	get description(): string {
		return this.doc.description;
	}
	set description(description: string) {
		this.doc.description = description;
	}

	get status(): string {
		return this.doc.status;
	}
	set status(status: string) {
		this.doc.status = status;
	}

	get priority(): number {
		return this.doc.priority;
	}
	set priority(priority: number) {
		this.doc.priority = priority;
	}

	get ticketType(): string | undefined {
		return this.doc.ticketType;
	}

	get communityId(): string {
        if (!this.doc.community) {
            throw new Error('community is not populated');
        }
		return this.doc.community.id.toString();
	}

	set communityId(communityId: string) {
		this.doc.community = new MongooseSeedwork.ObjectId(communityId);
	}

	get propertyId(): string | undefined {
		return this.doc.property?.toString();
	}

	set propertyId(propertyId: string | undefined) {
		if (propertyId) {
			this.doc.property = new MongooseSeedwork.ObjectId(propertyId);
		} else {
			this.doc.property = undefined;
		}
	}

	get requestorId(): string {
        if (!this.doc.requestor) {
            throw new Error('requestor is not populated');
        }
		return this.doc.requestor.id.toString();
	}

	set requestorId(requestorId: string) {
		this.doc.requestor = new MongooseSeedwork.ObjectId(requestorId);
	}

	get assignedToId(): string | undefined {
		return this.doc.assignedTo?.id.toString();
	}

	set assignedToId(assignedToId: string | undefined) {
		if (assignedToId) {
			this.doc.assignedTo = new MongooseSeedwork.ObjectId(assignedToId);
		} else {
			this.doc.assignedTo = undefined;
		}
	}

	get serviceId(): string | undefined {
		return this.doc.service?.toString();
	}

	set serviceId(serviceId: string | undefined) {
		if (serviceId) {
			this.doc.service = new MongooseSeedwork.ObjectId(serviceId);
		} else {
			this.doc.service = undefined;
		}
	}

	get activityLog(): DomainSeedwork.PropArray<Domain.Contexts.Case.ServiceTicket.V1.ServiceTicketV1ActivityDetailProps> {
		return new MongooseSeedwork.MongoosePropArray(this.doc.activityLog, ServiceTicketV1ActivityDetailDomainAdapter);
	}

	get messages(): DomainSeedwork.PropArray<Domain.Contexts.Case.ServiceTicket.V1.ServiceTicketV1MessageProps> {
		return new MongooseSeedwork.MongoosePropArray(this.doc.messages, ServiceTicketV1MessageDomainAdapter);
	}

	override get createdAt(): Date {
		return this.doc.createdAt;
	}

	override get updatedAt(): Date {
		return this.doc.updatedAt;
	}

	override get schemaVersion(): string {
		return this.doc.schemaVersion || '1.0.0';
	}

	get hash(): string {
		return this.doc.hash || '';
	}

	set hash(hash: string) {
		this.doc.hash = hash;
	}

	get lastIndexed(): Date | undefined {
		return this.doc.lastIndexed;
	}

	set lastIndexed(lastIndexed: Date | undefined) {
		this.doc.lastIndexed = lastIndexed;
	}

	get updateIndexFailedDate(): Date | undefined {
		return this.doc.updateIndexFailedDate;
	}

	set updateIndexFailedDate(updateIndexFailedDate: Date | undefined) {
		this.doc.updateIndexFailedDate = updateIndexFailedDate;
	}
}

class ServiceTicketV1ActivityDetailDomainAdapter implements Domain.Contexts.Case.ServiceTicket.V1.ServiceTicketV1ActivityDetailProps {
	public readonly doc: Models.Case.ServiceTicketActivityDetail;
	
	constructor(doc: Models.Case.ServiceTicketActivityDetail) {
		this.doc = doc;
	}
	
	public get id(): string {
		return this.doc.id?.valueOf() as string;
	}

	get activityType(): string {
		return this.doc.activityType;
	}
	
	set activityType(activityType: string) {
		this.doc.activityType = activityType;
	}

	get activityDescription(): string {
		return this.doc.activityDescription;
	}
	
	set activityDescription(activityDescription: string) {
		this.doc.activityDescription = activityDescription;
	}

	get activityBy(): Domain.Contexts.Community.Member.MemberEntityReference {
		if (!this.doc.activityBy) {
			throw new Error('activityBy is not populated');
		}
		if (this.doc.activityBy instanceof MongooseSeedwork.ObjectId) {
			throw new Error('activityBy is not populated or is not of the correct type');
		}
		// TODO: Temporary workaround for PropArray vs ReadonlyArray incompatibility
		// See GitHub issue: https://github.com/CellixJs/cellixjs/issues/78
		return new MemberDomainAdapter(this.doc.activityBy as Models.Member.Member) as unknown as Domain.Contexts.Community.Member.MemberEntityReference;
	}

	async loadActivityBy(): Promise<Domain.Contexts.Community.Member.MemberEntityReference> {
		if (!this.doc.activityBy) {
			throw new Error('activityBy is not populated');
		}
		if (this.doc.activityBy instanceof MongooseSeedwork.ObjectId) {
			await this.doc.populate('activityBy');
		}
		// TODO: Temporary workaround for PropArray vs ReadonlyArray incompatibility
		// See GitHub issue: https://github.com/CellixJs/cellixjs/issues/78
		return new MemberDomainAdapter(this.doc.activityBy as Models.Member.Member) as unknown as Domain.Contexts.Community.Member.MemberEntityReference;
	}

	set activityBy(member: Domain.Contexts.Community.Member.MemberEntityReference | Domain.Contexts.Community.Member.Member<MemberDomainAdapter>) {
		//check to see if member is derived from MongooseDomainAdapter
		if (member instanceof Domain.Contexts.Community.Member.Member) {
			this.doc.set('activityBy', member.props.doc);
			return;
		}

		if (!member?.id) {
			throw new Error('member reference is missing id');
		}

		this.doc.set('activityBy', new MongooseSeedwork.ObjectId(member.id));
	}
}

class ServiceTicketV1MessageDomainAdapter implements Domain.Contexts.Case.ServiceTicket.V1.ServiceTicketV1MessageProps {
	public readonly doc: Models.Case.ServiceTicketMessage;
	
	constructor(doc: Models.Case.ServiceTicketMessage) {
		this.doc = doc;
	}
	
	public get id(): string {
		return this.doc.id?.valueOf() as string;
	}

	get sentBy(): string {
		return this.doc.sentBy;
	}
	
	set sentBy(sentBy: string) {
		this.doc.sentBy = sentBy;
	}

	get initiatedBy(): Domain.Contexts.Community.Member.MemberEntityReference {
		if (!this.doc.initiatedBy) {
			throw new Error('initiatedBy is not populated');
		}
		if (this.doc.initiatedBy instanceof MongooseSeedwork.ObjectId) {
			throw new Error('initiatedBy is not populated or is not of the correct type');
		}
		// TODO: Temporary workaround for PropArray vs ReadonlyArray incompatibility
		// See GitHub issue: https://github.com/CellixJs/cellixjs/issues/78
		return new MemberDomainAdapter(this.doc.initiatedBy as Models.Member.Member) as unknown as Domain.Contexts.Community.Member.MemberEntityReference;
	}

	async loadInitiatedBy(): Promise<Domain.Contexts.Community.Member.MemberEntityReference> {
		if (!this.doc.initiatedBy) {
			throw new Error('initiatedBy is not populated');
		}
		if (this.doc.initiatedBy instanceof MongooseSeedwork.ObjectId) {
			await this.doc.populate('initiatedBy');
		}
		// TODO: Temporary workaround for PropArray vs ReadonlyArray incompatibility
		// See GitHub issue: https://github.com/CellixJs/cellixjs/issues/78
		return new MemberDomainAdapter(this.doc.initiatedBy as Models.Member.Member) as unknown as Domain.Contexts.Community.Member.MemberEntityReference;
	}

	set initiatedBy(member: Domain.Contexts.Community.Member.MemberEntityReference | Domain.Contexts.Community.Member.Member<MemberDomainAdapter>) {
		//check to see if member is derived from MongooseDomainAdapter
		if (member instanceof Domain.Contexts.Community.Member.Member) {
			this.doc.set('initiatedBy', member.props.doc);
			return;
		}

		if (!member?.id) {
			throw new Error('member reference is missing id');
		}

		this.doc.set('initiatedBy', new MongooseSeedwork.ObjectId(member.id));
	}

	get message(): string {
		return this.doc.message;
	}
	
	set message(message: string) {
		this.doc.message = message;
	}

	get embedding(){
		return this.doc.embedding;
	}
	
	set embedding(embedding: string | undefined) {
		this.doc.embedding = embedding || '';
	}

	get createdAt(): Date {
		return this.doc.createdAt;
	}
	
	set createdAt(createdAt: Date) {
		this.doc.createdAt = createdAt;
	}

	get isHiddenFromApplicant(): boolean {
		return this.doc.isHiddenFromApplicant;
	}
	
	set isHiddenFromApplicant(isHiddenFromApplicant: boolean) {
		this.doc.isHiddenFromApplicant = isHiddenFromApplicant;
	}
}