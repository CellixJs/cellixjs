import type { DataSources } from '@ocom/persistence';
import { EndUserRole, type EndUserRoleApplicationService } from './end-user-role/index.ts';

export interface RoleContext {
	EndUserRole: EndUserRoleApplicationService;
}

export const Role = (dataSources: DataSources): RoleContext => {
	return {
		EndUserRole: EndUserRole(dataSources),
	};
};
