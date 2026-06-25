import type { QueueServiceLifecycle, QueueServiceLogging } from '@cellix/service-queue-storage';
import type { ServiceQueueStorage } from './registry.ts';

/**
 * Application-facing queue operations exposed to OCOM services.
 *
 * This intentionally excludes lifecycle concerns such as `startUp`,
 * `shutDown`, and logging toggles. Application services depend only on the
 * strongly-typed queue methods generated from the registered queue
 * definitions.
 *
 * This stays aligned automatically as queues are added or removed from the
 * registered OCOM queue service.
 */
export type QueueStorageOperations = Omit<ServiceQueueStorage, keyof QueueServiceLifecycle | keyof QueueServiceLogging>;
