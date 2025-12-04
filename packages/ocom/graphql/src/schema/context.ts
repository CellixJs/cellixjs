import type { BaseContext } from '@apollo/server';
import type { ApplicationServices } from '@ocom/application-services';

/**
 * GraphQL context available to all resolvers.
 */
export interface GraphContext extends BaseContext {
    applicationServices: ApplicationServices;
}
