import type { DataSources } from '@ocom/persistence';
import { Service as ServiceApi, type ServiceApplicationService } from './service/index.ts';

export interface ServiceContextApplicationService {
    Service: ServiceApplicationService;
}

export const Service = (
    dataSources: DataSources
): ServiceContextApplicationService => {
    return {
        Service: ServiceApi(dataSources),
    }
}