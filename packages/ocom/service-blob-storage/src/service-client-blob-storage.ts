import { ServiceClientBlobStorage as CellixServiceClientBlobStorage, createFeatureFlagEnabledBlobStorageService } from '@cellix/service-blob-storage';

export const ServiceClientBlobStorage = createFeatureFlagEnabledBlobStorageService(CellixServiceClientBlobStorage);
export type ServiceClientBlobStorage = InstanceType<typeof ServiceClientBlobStorage>;
