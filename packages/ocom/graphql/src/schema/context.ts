import type { ApplicationServices } from '@ocom/application-services';

/**
 * GraphQL context available to all resolvers.
 */
export interface GraphContext {
	applicationServices: ApplicationServices;
}
