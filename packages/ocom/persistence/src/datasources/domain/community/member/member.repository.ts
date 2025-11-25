import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { Member } from '@ocom/data-sources-mongoose-models/member';
import { Domain } from '@ocom/domain';
import type { MemberDomainAdapter } from './member.domain-adapter.ts';

type MemberModelType = Member; // ReturnType<typeof MemberModelFactory> & Member & { baseModelName: string };
type PropType = MemberDomainAdapter;

export class MemberRepository //<
	//PropType extends Domain.Contexts.Member.Member.MemberProps
	//>
	extends MongooseSeedwork.MongoRepositoryBase<
		MemberModelType,
		PropType,
		Domain.Passport,
		Domain.Contexts.Community.Member.Member<PropType>
	>
	implements Domain.Contexts.Community.Member.MemberRepository<PropType>
{
	async getById(
		id: string,
	): Promise<Domain.Contexts.Community.Member.Member<PropType>> {
		const mongoMember = await this.model
			.findById(id)
			.populate(['community'])
			.exec();
		if (!mongoMember) {
			throw new Error(`Member with id ${id} not found`);
		}
		return this.typeConverter.toDomain(mongoMember, this.passport);
	}

	async getAll(): Promise<Domain.Contexts.Community.Member.Member<PropType>[]> {
		const mongoMembers = await this.model.find().populate(['community']).exec();
		return mongoMembers.map((member) =>
			this.typeConverter.toDomain(member, this.passport),
		);
	}

	async getAssignedToRole(
		roleId: string,
	): Promise<Domain.Contexts.Community.Member.Member<MemberDomainAdapter>[]> {
		const mongoMembers = await this.model
			.find({ role: new MongooseSeedwork.ObjectId(roleId) })
			.populate(['community', 'role'])
			.exec();
		return mongoMembers.map((member) =>
			this.typeConverter.toDomain(member, this.passport),
		);
	}

	// biome-ignore lint:noRequireAwait
	async getNewInstance(
		name: string,
		community: Domain.Contexts.Community.Community.CommunityEntityReference,
	): Promise<Domain.Contexts.Community.Member.Member<PropType>> {
		const adapter = this.typeConverter.toAdapter(new this.model());
		return Promise.resolve(
			Domain.Contexts.Community.Member.Member.getNewInstance(
				adapter,
				this.passport,
				name,
				community,
			),
		);
	}
}
