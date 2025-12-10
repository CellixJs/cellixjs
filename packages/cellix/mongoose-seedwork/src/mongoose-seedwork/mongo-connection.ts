import type mongoose from 'mongoose';
import type {
	Model,
	DefaultSchemaOptions,
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

export interface MongooseContextFactory {
	//  GetModel: GetModelFunctionWithSchema;

	readonly service: mongoose.Mongoose;
}

export function modelFactory<ModelType extends Base>(
	modelName: string,
	schema: Schema<ModelType, Model<ModelType>, ModelType>,
): (initializedService: MongooseContextFactory) => Model<ModelType> {
	return (initializedService: MongooseContextFactory) => {
		// [NN] [ESLINT] commenting this out to avoid @typescript-eslint/no-unnecessary-condition
		// if (!initializedService || !initializedService.service) {
		//   throw new Error('MongooseContextFactory is not initialized');
		// }

		//return initializedService.GetModel(modelName, schema);
		if (initializedService.service.models[modelName]) {
			return initializedService.service.models[modelName] as Model<ModelType>;
		}
		console.log('ServiceMongoose | registering model > ', modelName);
		return initializedService.service.model<ModelType>(modelName, schema);
		//return mongoose.model<ModelType>(modelName, schema);
	};
}
