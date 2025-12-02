import type { DataSourcesFactory } from '@ocom/persistence';
import type { TokenValidation } from '@ocom/service-token-validation';
import type { ServiceApolloServer } from '@ocom/service-apollo-server';
import type { GraphContext } from '@ocom/graphql';

export interface ApiContextSpec {
	//mongooseService:Exclude<ServiceMongoose, ServiceBase>;
	dataSourcesFactory: DataSourcesFactory; // NOT an infrastructure service
    tokenValidationService: TokenValidation;
	apolloServerService: ServiceApolloServer<GraphContext>;
}
