import { Domain, type DomainDataSource } from '@ocom/domain';

const { EventBusInstance, StaffRoleDeletedEvent } = Domain.Events;
export default (domainDataSource: DomainDataSource) => {
	EventBusInstance.register(StaffRoleDeletedEvent, async (payload) => {
		const { deletedRoleId, enterpriseAppRole, actorStaffUserId } = payload;
		return await Domain.Services.User.StaffRoleDeletedReassignmentService.reassignStaffUsersToDefaultRole(deletedRoleId, enterpriseAppRole, actorStaffUserId, domainDataSource);
	});
};
