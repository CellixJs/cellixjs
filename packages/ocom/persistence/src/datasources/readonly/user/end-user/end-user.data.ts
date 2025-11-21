import type { EndUser } from '@ocom/data-sources-mongoose-models';
import {
	type MongoDataSource,
	MongoDataSourceImpl,
} from '../../mongo-data-source.ts';

export interface EndUserDataSource extends MongoDataSource<EndUser> {}
export class EndUserDataSourceImpl
	extends MongoDataSourceImpl<EndUser>
	implements EndUserDataSource {}
