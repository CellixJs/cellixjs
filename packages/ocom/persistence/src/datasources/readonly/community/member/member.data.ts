import type { Member } from '@ocom/data-sources-mongoose-models/member';
import {
	type MongoDataSource,
	MongoDataSourceImpl,
} from '../../mongo-data-source.ts';

export interface MemberDataSource extends MongoDataSource<Member> {}

export class MemberDataSourceImpl
	extends MongoDataSourceImpl<Member>
	implements MemberDataSource {}
