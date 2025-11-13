import type { Models } from "@ocom/data-sources-mongoose-models";
import { MongoDataSourceImpl, type MongoDataSource } from "../../mongo-data-source.ts";

import { Community } from '@ocom/domain/contexts/community/community';
export interface CommunityDataSource extends MongoDataSource<Models.Community.Community> {}

export class CommunityDataSourceImpl extends MongoDataSourceImpl<Models.Community.Community> implements CommunityDataSource {}