import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { GeolocationLookupResult } from '@cellix/service-geolocation-base';
import { type Model, Schema } from 'mongoose';

export interface GeolocationLookup extends MongooseSeedwork.Base {
	provider: string;
	result: GeolocationLookupResult | null;
	lookedUpAt: Date;
}

const GeolocationLookupSchema = new Schema<GeolocationLookup, Model<GeolocationLookup>, GeolocationLookup>(
	{
		schemaVersion: { type: String, default: '1.0.0', required: false },
		provider: { type: String, required: true, maxlength: 100, index: true },
		result: { type: Schema.Types.Mixed, required: false, default: null },
		lookedUpAt: { type: Date, required: true, index: true },
	},
	{ timestamps: true, versionKey: 'version' },
);

export const GeolocationLookupModelName = 'GeolocationLookup';
export const GeolocationLookupModelFactory = MongooseSeedwork.modelFactory<GeolocationLookup>(GeolocationLookupModelName, GeolocationLookupSchema);
export type GeolocationLookupModelType = ReturnType<typeof GeolocationLookupModelFactory>;
