import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import { Domain } from '@ocom/domain';
import type { MemberInvitationDomainAdapter } from './member-invitation.domain-adapter.ts';
import type { MemberInvitation } from '@ocom/data-sources-mongoose-models/member/member-invitation';

type MemberInvitationModelType = MemberInvitation;
type PropType = MemberInvitationDomainAdapter;

export class MemberInvitationRepository
	extends MongooseSeedwork.MongoRepositoryBase<MemberInvitationModelType, PropType, Domain.Passport, Domain.Contexts.Community.Member.MemberInvitation<PropType>>
	implements Domain.Contexts.Community.Member.MemberInvitationRepository<PropType>
{
	async getById(id: string): Promise<Domain.Contexts.Community.Member.MemberInvitation<PropType>> {
		const doc = await this.model.findById(id).exec();
		if (!doc) {
			throw new Error(`MemberInvitation with id ${id} not found`);
		}
		return this.typeConverter.toDomain(doc, this.passport);
	}

	async getByCommunityId(communityId: string): Promise<Domain.Contexts.Community.Member.MemberInvitation<PropType>[]> {
		const docs = await this.model.find({ communityId }).exec();
		return docs.map((doc) => this.typeConverter.toDomain(doc, this.passport));
	}

	getNewInstance(communityId: string, email: string, message: string, expiresAt: Date, invitedById: string): Promise<Domain.Contexts.Community.Member.MemberInvitation<PropType>> {
		const adapter = this.typeConverter.toAdapter(new this.model());
		adapter.communityId = communityId;
		const invitedByRef = { id: invitedById } as Domain.Contexts.User.EndUser.EndUserEntityReference;
		return Promise.resolve(Domain.Contexts.Community.Member.MemberInvitation.getNewInstance(adapter, this.passport, communityId, email, message, expiresAt, invitedByRef));
	}
}
