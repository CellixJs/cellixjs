
import { type MongoDataSource, MongoDataSourceImpl } from '../../mongo-data-source.ts';
import type { EndUser } from '@ocom/data-sources-mongoose-models/user';

export interface EndUserDataSource extends MongoDataSource<EndUser> {}
export class EndUserDataSourceImpl extends MongoDataSourceImpl<EndUser> implements EndUserDataSource {}