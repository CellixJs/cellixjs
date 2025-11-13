import * as MongooseSeedwork from '@cellix/mongoose-seedwork';
import type { Models } from '@ocom/data-sources-mongoose-models';
import type { Passport } from '@ocom/domain';
import type { EndUserRoleDomainAdapter } from './end-user-role.domain-adapter.ts';

import { EndUserRole } from '@ocom/domain/contexts/community/role/end-user-role';
type EndUserRoleModelType = Models.Role.EndUserRole; // ReturnType<typeof Models.EndUserRole.EndUserRoleModelFactory> & Models.EndUserRole.EndUserRole & { baseModelName: string };
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
			getNewInstance(
				adapter,
                this.passport,
				roleName,
                isDefault,
				community,
			),
		);
	}
}
