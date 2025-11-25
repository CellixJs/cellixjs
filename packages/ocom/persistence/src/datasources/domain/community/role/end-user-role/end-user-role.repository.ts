import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { EndUserRole } from '@ocom/data-sources-mongoose-models/user';
import { Domain } from '@ocom/domain';
import type { EndUserRoleDomainAdapter } from './end-user-role.domain-adapter.ts';

type EndUserRoleModelType = EndUserRole; // ReturnType<typeof EndUserRoleModelFactory> & EndUserRole & { baseModelName: string };
type PropType = EndUserRoleDomainAdapter;

export class EndUserRoleRepository //<
	//PropType extends Domain.Contexts.EndUserRole.EndUserRole.EndUserRoleProps
	//>
	extends MongooseSeedwork.MongoRepositoryBase<
		EndUserRoleModelType,
		PropType,
		Domain.Passport,
		Domain.Contexts.Community.Role.EndUserRole.EndUserRole<PropType>
	>
	implements
		Domain.Contexts.Community.Role.EndUserRole.EndUserRoleRepository<PropType>
{
	async getById(
		id: string,
	): Promise<Domain.Contexts.Community.Role.EndUserRole.EndUserRole<PropType>> {
		const mongoEndUserRole = await this.model.findById(id).exec();
		if (!mongoEndUserRole) {
			throw new Error(`EndUserRole with id ${id} not found`);
		}
		return this.typeConverter.toDomain(mongoEndUserRole, this.passport);
	}
	// biome-ignore lint:noRequireAwait
	async getNewInstance(
		roleName: string,
		isDefault: boolean,
		community: Domain.Contexts.Community.Community.CommunityEntityReference,
	): Promise<Domain.Contexts.Community.Role.EndUserRole.EndUserRole<PropType>> {
		const adapter = this.typeConverter.toAdapter(new this.model());
		return Promise.resolve(
			Domain.Contexts.Community.Role.EndUserRole.EndUserRole.getNewInstance(
				adapter,
				this.passport,
				roleName,
				isDefault,
				community,
			),
		);
	}
}
