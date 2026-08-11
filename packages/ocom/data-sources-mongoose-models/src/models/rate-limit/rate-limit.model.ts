import type { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import { type Model, Schema } from 'mongoose';

export interface RateLimit {
	_id: string;
	count: number;
	expiresAt: Date;
}

const RateLimitSchema = new Schema<RateLimit, Model<RateLimit>, RateLimit>(
	{
		_id: { type: String, required: true },
		count: { type: Number, required: true },
		expiresAt: { type: Date, required: true },
	},
	{ versionKey: false },
).index({ expiresAt: 1 }, { expireAfterSeconds: 0, name: 'rate-limit-expires-at' });

export const RateLimitModelName = 'RateLimit';

/** Creates the application-owned rate-limit model and TTL index definition. */
export const RateLimitModelFactory = (initializedService: MongooseSeedwork.MongooseContextFactory): Model<RateLimit> => {
	const existingModel = initializedService.service.models[RateLimitModelName];
	return existingModel ? (existingModel as Model<RateLimit>) : initializedService.service.model<RateLimit>(RateLimitModelName, RateLimitSchema, 'rate-limits');
};

export type RateLimitModelType = ReturnType<typeof RateLimitModelFactory>;
