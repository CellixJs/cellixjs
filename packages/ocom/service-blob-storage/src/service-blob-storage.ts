import { ServiceBlobStorage as CellixServiceBlobStorage, createFeatureFlagEnabledBlobStorageService } from '@cellix/service-blob-storage';

export const ServiceBlobStorage = createFeatureFlagEnabledBlobStorageService(CellixServiceBlobStorage);
export type ServiceBlobStorage = InstanceType<typeof ServiceBlobStorage>;
