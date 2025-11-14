import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { Models } from '@ocom/data-sources-mongoose-models';
import { Domain } from '@ocom/domain';
import type { EndUserRoleDomainAdapter } from './end-user-role.domain-adapter.ts';

type EndUserRoleModelType = Models.Role.EndUserRole; // ReturnType<typeof Models.EndUserRole.EndUserRoleModelFactory> & Models.EndUserRole.EndUserRole & { baseModelName: string };
type PropType = EndUserRoleDomainAdapter;

export class EndUserRoleRepository //<
	//PropType extends Domain.EndUserRole.EndUserRoleProps
	//>
	extends MongooseSeedwork.MongoRepositoryBase<
		EndUserRoleModelType,
		PropType,
		Domain.Passport,
		Domain.EndUserRole.EndUserRole<PropType>
	>
	implements Domain.EndUserRole.EndUserRoleRepository<PropType>
{
	async getById(
		id: string,
	): Promise<Domain.EndUserRole.EndUserRole<PropType>> {
		const mongoEndUserRole = await this.model
			.findById(id)
			.exec();
		if (!mongoEndUserRole) {
			throw new Error(`EndUserRole with id ${id} not found`);
		}
		return this.typeConverter.toDomain(mongoEndUserRole, this.passport);
	}
	// biome-ignore lint:noRequireAwait
	async getNewInstance(
		roleName: string,
        isDefault: boolean,
		community: Domain.Community.CommunityEntityReference
	): Promise<Domain.EndUserRole.EndUserRole<PropType>> {
		const adapter = this.typeConverter.toAdapter(new this.model());
		return Promise.resolve(
			Domain.EndUserRole.EndUserRole.getNewInstance(
				adapter,
                this.passport,
				roleName,
                isDefault,
				community,
			),
		);
	}
}
