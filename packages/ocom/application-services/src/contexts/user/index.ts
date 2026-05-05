import type { DataSources } from '@ocom/persistence';
import { EndUser as EndUserApi, type EndUserApplicationService } from './end-user/index.ts';
import { StaffRole as StaffRoleApi, type StaffRoleApplicationService } from './staff-role/index.ts';
import { StaffUser as StaffUserApi, type StaffUserApplicationService } from './staff-user/index.ts';

export interface UserContextApplicationService {
	EndUser: EndUserApplicationService;
	StaffRole: StaffRoleApplicationService;
	StaffUser: StaffUserApplicationService;
}

export const User = (dataSources: DataSources): UserContextApplicationService => {
	return {
		EndUser: EndUserApi(dataSources),
		StaffRole: StaffRoleApi(dataSources),
		StaffUser: StaffUserApi(dataSources),
	};
};
