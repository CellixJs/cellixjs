import type * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';
import * as MongooseSeedwork from '@cellix/mongoose-seedwork';
import type { Models } from '@ocom/data-sources-mongoose-models';
import type { Passport } from '@ocom/domain';
import { CommunityDomainAdapter } from '../../community/community/community.domain-adapter.ts';
import { MemberDomainAdapter } from '../../community/member/member.domain-adapter.ts';

import { ServiceTicketV1 } from '@ocom/domain/contexts/case/service-ticket/v1';
import { Community } from '@ocom/domain/contexts/community/community';
import { Member } from '@ocom/domain/contexts/community/member';
export class ServiceTicketV1Converter extends MongooseSeedwork.MongoTypeConverter<
	Models.Case.ServiceTicket,
	ServiceTicketV1DomainAdapter,
	Passport,
	ServiceTicketV1<ServiceTicketV1DomainAdapter>
> {
	constructor() {
		super(
			ServiceTicketV1DomainAdapter,
			ServiceTicketV1
		);
	}
}

export class ServiceTicketV1DomainAdapter
	extends MongooseSeedwork.MongooseDomainAdapter<Models.Case.ServiceTicket>
	implements ServiceTicketV1Props
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
            throw new Error('community is not set');
        }
        if (this.doc.community instanceof MongooseSeedwork.ObjectId) {
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
            throw new Error('requestor is not set');
        }
        if (this.doc.requestor instanceof MongooseSeedwork.ObjectId) {
            throw new Error('requestor is not populated');
        }
		return this.doc.requestor.id.toString();
	}

	set requestorId(requestorId: string) {
		this.doc.requestor = new MongooseSeedwork.ObjectId(requestorId);
	}

	get community(): CommunityProps {
		if (!this.doc.community) {
			throw new Error('community is not populated');
		}
		if (this.doc.community instanceof MongooseSeedwork.ObjectId) {
			throw new Error('community is not populated');
		}
		return new CommunityDomainAdapter(this.doc.community as Models.Community.Community);
	}

	async loadCommunity(): Promise<CommunityProps> {
		if (!this.doc.community) {
			throw new Error('community is not populated');
		}
		if (this.doc.community instanceof MongooseSeedwork.ObjectId) {
			await this.doc.populate('community');
		}
		return new CommunityDomainAdapter(this.doc.community as Models.Community.Community);
	}

	set community(community: CommunityEntityReference | Community<CommunityDomainAdapter>) {
		//check to see if community is derived from MongooseDomainAdapter
		if (community instanceof Community) {
			this.doc.set('community', community.props.doc);
			return;
		}

		if (!community?.id) {
			throw new Error('community reference is missing id');
		}

		this.doc.set('community', community);
	}

	get requestor(): MemberProps {
		if (!this.doc.requestor) {
			throw new Error('requestor is not populated');
		}
		if (this.doc.requestor instanceof MongooseSeedwork.ObjectId) {
			throw new Error('requestor is not populated');
		}
		return new MemberDomainAdapter(this.doc.requestor as Models.Member.Member);
	}

	async loadRequestor(): Promise<MemberProps> {
		if (!this.doc.requestor) {
			throw new Error('requestor is not populated');
		}
		if (this.doc.requestor instanceof MongooseSeedwork.ObjectId) {
			await this.doc.populate('requestor');
		}
		return new MemberDomainAdapter(this.doc.requestor as Models.Member.Member);
	}

	set requestor(member: MemberEntityReference | Member<MemberDomainAdapter>) {
		//check to see if member is derived from MongooseDomainAdapter
		if (member instanceof Member) {
			this.doc.set('requestor', member.props.doc);
			return;
		}

		if (!member?.id) {
			throw new Error('member reference is missing id');
		}

		this.doc.set('requestor', member);
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

	get activityLog(): DomainSeedwork.PropArray<ServiceTicketV1ActivityDetailProps> {
		return new MongooseSeedwork.MongoosePropArray(this.doc.activityLog, ServiceTicketV1ActivityDetailDomainAdapter);
	}

	get messages(): DomainSeedwork.PropArray<ServiceTicketV1MessageProps> {
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

export { ServiceTicketV1ActivityDetailDomainAdapter, ServiceTicketV1MessageDomainAdapter };

class ServiceTicketV1ActivityDetailDomainAdapter implements ServiceTicketV1ActivityDetailProps {
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

	get activityBy(): MemberEntityReference {
		if (!this.doc.activityBy) {
			throw new Error('activityBy is not populated');
		}
		if (this.doc.activityBy instanceof MongooseSeedwork.ObjectId) {
			throw new Error('activityBy is not populated or is not of the correct type');
		}
		// TODO: Temporary workaround for PropArray vs ReadonlyArray incompatibility
		// See GitHub issue: https://github.com/CellixJs/cellixjs/issues/78
		return new MemberDomainAdapter(this.doc.activityBy as Models.Member.Member) as unknown as MemberEntityReference;
	}

	async loadActivityBy(): Promise<MemberEntityReference> {
		if (!this.doc.activityBy) {
			throw new Error('activityBy is not populated');
		}
		if (this.doc.activityBy instanceof MongooseSeedwork.ObjectId) {
			await this.doc.populate('activityBy');
		}
		// TODO: Temporary workaround for PropArray vs ReadonlyArray incompatibility
		// See GitHub issue: https://github.com/CellixJs/cellixjs/issues/78
		return new MemberDomainAdapter(this.doc.activityBy as Models.Member.Member) as unknown as MemberEntityReference;
	}

	set activityBy(member: MemberEntityReference | Member<MemberDomainAdapter>) {
		//check to see if member is derived from MongooseDomainAdapter
		if (member instanceof Member) {
			this.doc.set('activityBy', member.props.doc);
			return;
		}

		if (!member?.id) {
			throw new Error('member reference is missing id');
		}

		this.doc.set('activityBy', member);
	}
}

class ServiceTicketV1MessageDomainAdapter implements ServiceTicketV1MessageProps {
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

	get initiatedBy(): MemberEntityReference {
		if (!this.doc.initiatedBy) {
			throw new Error('initiatedBy is not populated');
		}
		if (this.doc.initiatedBy instanceof MongooseSeedwork.ObjectId) {
			throw new Error('initiatedBy is not populated or is not of the correct type');
		}
		// TODO: Temporary workaround for PropArray vs ReadonlyArray incompatibility
		// See GitHub issue: https://github.com/CellixJs/cellixjs/issues/78
		return new MemberDomainAdapter(this.doc.initiatedBy as Models.Member.Member) as unknown as MemberEntityReference;
	}

	async loadInitiatedBy(): Promise<MemberEntityReference> {
		if (!this.doc.initiatedBy) {
			throw new Error('initiatedBy is not populated');
		}
		if (this.doc.initiatedBy instanceof MongooseSeedwork.ObjectId) {
			await this.doc.populate('initiatedBy');
		}
		// TODO: Temporary workaround for PropArray vs ReadonlyArray incompatibility
		// See GitHub issue: https://github.com/CellixJs/cellixjs/issues/78
		return new MemberDomainAdapter(this.doc.initiatedBy as Models.Member.Member) as unknown as MemberEntityReference;
	}

	set initiatedBy(member: MemberEntityReference | Member<MemberDomainAdapter>) {
		//check to see if member is derived from MongooseDomainAdapter
		if (member instanceof Member) {
			this.doc.set('initiatedBy', member.props.doc);
			return;
		}

		if (!member?.id) {
			throw new Error('member reference is missing id');
		}

		this.doc.set('initiatedBy', member);
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