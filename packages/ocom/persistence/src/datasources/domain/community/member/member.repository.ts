import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { Models } from '@ocom/data-sources-mongoose-models';
import type { MemberDomainAdapter } from './member.domain-adapter.ts';
import type * as Community from '@ocom/domain/contexts/community';
import type * as Member from '@ocom/domain/contexts/member';
import type { Passport } from '@ocom/domain/contexts/passport';
// Runtime import for class constructor
import { Member as MemberClass } from '@ocom/domain/contexts/member';

type MemberModelType = Models.Member.Member; // ReturnType<typeof Models.Member.MemberModelFactory> & Models.Member.Member & { baseModelName: string };
type PropType = MemberDomainAdapter;

export class MemberRepository //<
	//PropType extends Member.MemberProps
	//>
	extends MongooseSeedwork.MongoRepositoryBase<
		MemberModelType,
		PropType,
		Passport,
		Member.Member<PropType>
	>
	implements Member.MemberRepository<PropType>
{
	async getById(
		id: string,
	): Promise<Member.Member<PropType>> {
		const mongoMember = await this.model
			.findById(id)
			.populate(['community'])
			.exec();
		if (!mongoMember) {
			throw new Error(`Member with id ${id} not found`);
		}
		return this.typeConverter.toDomain(mongoMember, this.passport);
	}

    async getAll(): Promise<Member.Member<PropType>[]> {
        const mongoMembers = await this.model.find().populate(['community']).exec();
        return mongoMembers.map(member => this.typeConverter.toDomain(member, this.passport));
    }

    async getAssignedToRole(roleId: string): Promise<Member.Member<MemberDomainAdapter>[]> {
        const mongoMembers = await this.model.find({ role: new MongooseSeedwork.ObjectId(roleId) }).populate(['community', 'role']).exec();
        return mongoMembers.map(member => this.typeConverter.toDomain(member, this.passport));
    }

	// biome-ignore lint:noRequireAwait
	async getNewInstance(
		name: string,
		community: Community.CommunityEntityReference
	): Promise<Member.Member<PropType>> {
		const adapter = this.typeConverter.toAdapter(new this.model());
		return Promise.resolve(
			MemberClass.getNewInstance(
				adapter,
                this.passport,
				name,
				community,
			),
		);
	}
}
