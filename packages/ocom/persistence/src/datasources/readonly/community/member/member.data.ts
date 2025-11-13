import type { Models } from "@ocom/data-sources-mongoose-models";
import { MongoDataSourceImpl, type MongoDataSource } from "../../mongo-data-source.ts";

import { Member } from '@ocom/domain/contexts/community/member';
export interface MemberDataSource extends MongoDataSource<Models.Member.Member> {}

export class MemberDataSourceImpl extends MongoDataSourceImpl<Models.Member.Member> implements MemberDataSource {}