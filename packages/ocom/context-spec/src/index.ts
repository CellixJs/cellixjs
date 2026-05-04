import type { DataSourcesFactory } from '@ocom/persistence';
import type { ServiceApolloServer } from '@ocom/service-apollo-server';
import type { TokenValidation } from '@ocom/service-token-validation';

export interface ApiContextSpec {
	//mongooseService:Exclude<ServiceMongoose, ServiceBase>;
	dataSourcesFactory: DataSourcesFactory; // NOT an infrastructure service
	tokenValidationService: TokenValidation;
	apolloServerService: ServiceApolloServer<Record<string, never>>;
}
