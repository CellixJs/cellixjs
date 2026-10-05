import type { Video } from '@ocom/data-sources-mongoose-models/video';
import { type MongoDataSource, MongoDataSourceImpl } from '../../mongo-data-source.ts';

export interface VideoDataSource extends MongoDataSource<Video> {}

export class VideoDataSourceImpl extends MongoDataSourceImpl<Video> implements VideoDataSource {}
