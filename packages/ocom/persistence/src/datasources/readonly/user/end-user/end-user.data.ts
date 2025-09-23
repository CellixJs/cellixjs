import type { Models } from '@ocom/data-sources-mongoose-models';
import { type MongoDataSource, MongoDataSourceImpl } from '../../mongo-data-source.ts';

export interface EndUserDataSource extends MongoDataSource<Models.User.EndUser> {}
export class EndUserDataSourceImpl extends MongoDataSourceImpl<Models.User.EndUser> implements EndUserDataSource {}