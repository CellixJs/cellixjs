import type { DataSources } from '@ocom/api-persistence';
import { EndUser as EndUserApi, type EndUserApplicationService } from './end-user/index.ts';

export interface UserContextApplicationService {
    EndUser: EndUserApplicationService;
}

export const User = (
    dataSources: DataSources
): UserContextApplicationService => {
    return {
        EndUser: EndUserApi(dataSources),
    }
}