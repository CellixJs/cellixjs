import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import { ensureMemberViewable } from './ensure-member-viewable.ts';

export interface MemberQueryByIdWithRoleCommand {
	id: string;
}

export const queryByIdWithRole = (dataSources: DataSources) => {
	return async (command: MemberQueryByIdWithRoleCommand): Promise<Domain.Contexts.Community.Member.MemberEntityReference | null> => {
		const member = await dataSources.readonlyDataSource.Community.Member.MemberReadRepo.getByIdWithRole(command.id);
		if (member) {
			ensureMemberViewable(dataSources.passport, member);
		}
		return member;
	};
};
