import type { DataSources } from '@ocom/persistence';
import type { BlobStorageOperations, ClientUploadOperations } from '@ocom/service-blob-storage';
import { TechAdmin as TechAdminApi, type TechAdminApplicationService } from '../tech-admin/index.ts';
import { EndUser as EndUserApi, type EndUserApplicationService } from './end-user/index.ts';
import { StaffRole as StaffRoleApi, type StaffRoleApplicationService } from './staff-role/index.ts';
import { StaffUser as StaffUserApi, type StaffUserApplicationService } from './staff-user/index.ts';

export interface UserContextApplicationService {
	EndUser: EndUserApplicationService;
	StaffRole: StaffRoleApplicationService;
	StaffUser: StaffUserApplicationService;
	TechAdmin: TechAdminApplicationService;
}

export const User = (dataSources: DataSources, blobStorageService: BlobStorageOperations, clientOperationsService?: ClientUploadOperations): UserContextApplicationService => {
	return {
		EndUser: EndUserApi(dataSources),
		StaffRole: StaffRoleApi(dataSources),
		StaffUser: StaffUserApi(dataSources),
		TechAdmin: TechAdminApi(blobStorageService, clientOperationsService),
	};
};
