import type { HttpHandler } from '@azure/functions-v4';
import type { ApplicationServicesFactory } from '@ocom/api-application-services';
import type { GraphContext } from '@ocom/api-graphql';
export declare const graphHandlerCreator: (applicationServicesFactory: ApplicationServicesFactory<GraphContext>) => HttpHandler;
