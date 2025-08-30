import type { DataSourcesFactory } from '@ocom/api-persistence';
import type { TokenValidation } from '@ocom/service-token-validation';
import type { ApolloServerProvider } from '@ocom/service-apollo-server';
import type { BaseContext } from '@apollo/server';

export interface ApiContextSpec<TGraphContext extends BaseContext = BaseContext> {
	//mongooseService:Exclude<ServiceMongoose, ServiceBase>;
	dataSourcesFactory: DataSourcesFactory; // NOT an infrastructure service
    tokenValidationService: TokenValidation;
    apolloServerService: ApolloServerProvider<TGraphContext>;
}
