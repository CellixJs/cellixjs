import { Domain } from '@ocom/domain';
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { MemberInvitation } from '@ocom/data-sources-mongoose-models/member/member-invitation';
import type { EndUser } from '@ocom/data-sources-mongoose-models/user/end-user';
import { EndUserDomainAdapter } from '../../user/end-user/end-user.domain-adapter.ts';

export class MemberInvitationConverter extends MongooseSeedwork.MongoTypeConverter<
	MemberInvitation,
	MemberInvitationDomainAdapter,
	Domain.Passport,
	Domain.Contexts.Community.Member.MemberInvitation<MemberInvitationDomainAdapter>
> {
	constructor() {
		super(MemberInvitationDomainAdapter, Domain.Contexts.Community.Member.MemberInvitation<MemberInvitationDomainAdapter>);
	}
}

export class MemberInvitationDomainAdapter extends MongooseSeedwork.MongooseDomainAdapter<MemberInvitation> implements Domain.Contexts.Community.Member.MemberInvitationProps {
	get communityId(): string {
		return this.doc.communityId;
	}
	set communityId(communityId: string) {
		this.doc.communityId = communityId;
	}

	get email(): string {
		return this.doc.email;
	}
	set email(email: string) {
		this.doc.email = email;
	}

	get message(): string {
		return this.doc.message ?? '';
	}
	set message(message: string) {
		this.doc.message = message;
	}

	get status(): string {
		return this.doc.status;
	}
	set status(status: string) {
		this.doc.status = status;
	}

	get expiresAt(): Date {
		return this.doc.expiresAt;
	}
	set expiresAt(expiresAt: Date) {
		this.doc.expiresAt = expiresAt;
	}

	get invitedBy(): Domain.Contexts.User.EndUser.EndUserEntityReference {
		if (!this.doc.invitedBy) {
			throw new Error('invitedBy is not populated');
		}
		if (this.doc.invitedBy instanceof MongooseSeedwork.ObjectId) {
			return { id: this.doc.invitedBy.toString() } as Domain.Contexts.User.EndUser.EndUserEntityReference;
		}
		return new EndUserDomainAdapter(this.doc.invitedBy as EndUser);
	}
	set invitedBy(invitedBy: Domain.Contexts.User.EndUser.EndUserEntityReference) {
		if (!invitedBy?.id) {
			throw new Error('invitedBy reference is missing id');
		}
		this.doc.set('invitedBy', new MongooseSeedwork.ObjectId(invitedBy.id));
	}

	get acceptedBy(): Domain.Contexts.User.EndUser.EndUserEntityReference | undefined {
		if (!this.doc.acceptedBy) {
			return undefined;
		}
		if (this.doc.acceptedBy instanceof MongooseSeedwork.ObjectId) {
			return { id: this.doc.acceptedBy.toString() } as Domain.Contexts.User.EndUser.EndUserEntityReference;
		}
		return new EndUserDomainAdapter(this.doc.acceptedBy as EndUser);
	}
	set acceptedBy(acceptedBy: Domain.Contexts.User.EndUser.EndUserEntityReference | undefined) {
		if (!acceptedBy) {
			this.doc.acceptedBy = undefined;
			return;
		}
		if (!acceptedBy.id) {
			throw new Error('acceptedBy reference is missing id');
		}
		this.doc.set('acceptedBy', new MongooseSeedwork.ObjectId(acceptedBy.id));
	}

	override get createdAt(): Date {
		return this.doc.createdAt;
	}

	override get updatedAt(): Date {
		return this.doc.updatedAt;
	}
}
