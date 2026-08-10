import type { Property } from '@ocom/data-sources-mongoose-models/property';
import { type MongoDataSource, MongoDataSourceImpl } from '../../mongo-data-source.ts';

export interface PropertyDataSource extends MongoDataSource<Property> {}

export class PropertyDataSourceImpl extends MongoDataSourceImpl<Property> implements PropertyDataSource {}
