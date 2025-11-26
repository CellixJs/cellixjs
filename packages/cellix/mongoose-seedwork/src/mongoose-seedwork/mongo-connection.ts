import type {
  DefaultSchemaOptions,
  Model,
  ObtainDocumentType,
  ResolveSchemaOptions,
  Schema,
  SchemaDefinition,
  SchemaDefinitionType
} from 'mongoose';
import type { Base } from './base.ts';

export type SchemaConstructor<ModelType extends Base> =
	| ObtainDocumentType<
			unknown,
			ModelType,
			ResolveSchemaOptions<DefaultSchemaOptions>
	  >
	| SchemaDefinition<SchemaDefinitionType<ModelType>, ModelType>;
export type GetModelFunction = <ModelType extends Base>(
	modelName: string,
	schemaConstructor: SchemaConstructor<ModelType>,
) => Model<ModelType>;
export type GetModelFunctionWithSchema = <ModelType extends Base>(
	modelName: string,
	schema: Schema<ModelType, Model<ModelType>, ModelType>,
) => Model<ModelType>;
export type { Schema } from 'mongoose';


export interface MinimalMongooseService<ModelType extends Base> {
	models: Record<string, Model<ModelType>>;
	model: (name: string, schema: Schema<ModelType, Model<ModelType>, ModelType>) => Model<ModelType>;
}

export interface MongooseContextFactory<ModelType extends Base> {
	readonly service: MinimalMongooseService<ModelType>;
}


export function modelFactory<ModelType extends Base>(
  modelName: string,
  schema: Schema<ModelType, Model<ModelType>, ModelType>
): (initializedService: MongooseContextFactory<ModelType>) => Model<ModelType> {
  return (initializedService: MongooseContextFactory<ModelType>) => {
    const model = initializedService.service.models[modelName];
    if (model && isModel<ModelType>(model)) {
      return model;
    }
    console.log('ServiceMongoose | registering model > ', modelName);
    return initializedService.service.model(modelName, schema);
  };
}

function isModel<T>(model: unknown): model is Model<T> {
	return typeof model === 'object' && model !== null && 'base' in model;
}
