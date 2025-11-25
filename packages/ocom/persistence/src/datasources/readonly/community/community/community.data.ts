import type { Community } from '@ocom/data-sources-mongoose-models/community';
import {
	type MongoDataSource,
	MongoDataSourceImpl,
} from '../../mongo-data-source.ts';

export interface CommunityDataSource extends MongoDataSource<Community> {}

export class CommunityDataSourceImpl
	extends MongoDataSourceImpl<Community>
	implements CommunityDataSource {}
