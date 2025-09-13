import type { DataSourcesFactory } from '@ocom/persistence';
import type { TokenValidation } from '@ocom/service-token-validation';
export interface ApiContextSpec {
	//mongooseService:Exclude<ServiceMongoose, ServiceBase>;
	dataSourcesFactory: DataSourcesFactory; // NOT an infrastructure service
    tokenValidationService: TokenValidation;
}
