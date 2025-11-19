import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { Models } from '@ocom/data-sources-mongoose-models';
import type { EndUserRoleDomainAdapter } from './end-user-role.domain-adapter.ts';
import type { CommunityEntityReference } from '@ocom/domain/contexts/community';
import type { EndUserRole, EndUserRoleProps, EndUserRoleRepository } from '@ocom/domain/contexts/end-user-role';
import type { Passport } from '@ocom/domain/contexts/passport';
// Runtime import for class constructor
import { EndUserRole as EndUserRoleClass } from '@ocom/domain/contexts/end-user-role';

type EndUserRoleModelType = Models.Role.EndUserRole; // ReturnType<typeof Models.EndUserRole.EndUserRoleModelFactory> & Models.EndUserRole & { baseModelName: string };
type PropType = EndUserRoleDomainAdapter;

export class EndUserRoleRepository //<
	//PropType extends EndUserRoleProps
	//>
	extends MongooseSeedwork.MongoRepositoryBase<
		EndUserRoleModelType,
		PropType,
		Passport,
		EndUserRole<PropType>
	>
	implements EndUserRoleRepository<PropType>
{
	async getById(
		id: string,
	): Promise<EndUserRole<PropType>> {
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
		community: CommunityEntityReference
	): Promise<EndUserRole<PropType>> {
		const adapter = this.typeConverter.toAdapter(new this.model());
		return Promise.resolve(
			EndUserRoleClass.getNewInstance(
				adapter,
                this.passport,
				roleName,
                isDefault,
				community,
			),
		);
	}
}
