import type { CommunityConfig } from '@ocom/data-sources-mongoose-models/community/community-config';
import { type MongoDataSource, MongoDataSourceImpl } from '../../mongo-data-source.ts';

export interface CommunityConfigDataSource extends MongoDataSource<CommunityConfig> {}

export class CommunityConfigDataSourceImpl extends MongoDataSourceImpl<CommunityConfig> implements CommunityConfigDataSource {}
