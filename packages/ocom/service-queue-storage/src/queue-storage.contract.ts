import type { AppQueueConsumerContext, AppQueueProducerContext } from './registry.ts';

/**
 * Downscoped contract for application queue storage access.
 * Exposes all strongly-typed send, receive, and peek operations for every
 * registered queue without exposing infrastructure lifecycle methods.
 */
export type QueueStorageOperations = AppQueueProducerContext & AppQueueConsumerContext;
