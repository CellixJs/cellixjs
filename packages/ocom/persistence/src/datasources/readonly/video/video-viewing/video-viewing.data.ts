import type { VideoViewing } from '@ocom/data-sources-mongoose-models/video-viewing';
import { type MongoDataSource, MongoDataSourceImpl } from '../../mongo-data-source.ts';

export interface VideoViewingDataSource extends MongoDataSource<VideoViewing> {}

export class VideoViewingDataSourceImpl extends MongoDataSourceImpl<VideoViewing> implements VideoViewingDataSource {}
