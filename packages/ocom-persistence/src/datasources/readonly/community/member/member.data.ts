import type { Models } from "@ocom/api-data-sources-mongoose-models";
import { MongoDataSourceImpl, type MongoDataSource } from "../../mongo-data-source.ts";

export interface MemberDataSource extends MongoDataSource<Models.Member.Member> {}

export class MemberDataSourceImpl extends MongoDataSourceImpl<Models.Member.Member> implements MemberDataSource {}