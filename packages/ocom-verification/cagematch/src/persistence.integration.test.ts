import { createGeolocationApplicationService } from '@ocom/application-services';
import { Persistence } from '@ocom/persistence';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('geolocation application service persistence', () => {
	let mongoServer: MongoMemoryServer;

	beforeAll(async () => {
		mongoServer = await MongoMemoryServer.create();
		await mongoose.connect(mongoServer.getUri());
	});

	afterAll(async () => {
		await mongoose.disconnect();
		await mongoServer.stop();
	});

	it('stores a normalized lookup through the application service and Mongoose persistence factory', async () => {
		const dataSourcesFactory = Persistence({ service: mongoose } as Parameters<typeof Persistence>[0]);
		const lookupService = {
			provider: 'verification-provider',
			startUp: async () => lookupService,
			shutDown: async () => undefined,
			lookup: async () => ({ provider: 'verification-provider', countryCode: 'CA', city: 'Toronto' }),
		};
		const applicationService = createGeolocationApplicationService(lookupService, dataSourcesFactory.geolocationLookupStore, 'azureClientIp');

		await applicationService.captureRequest({
			forwardedFor: '203.0.113.10',
			azureClientIp: '198.51.100.20',
			azureSocketIp: undefined,
			realIp: undefined,
		});

		const model = mongoose.model('GeolocationLookup');
		const saved = await model.findOne({}).lean();
		expect(saved).toMatchObject({
			provider: 'verification-provider',
			result: { provider: 'verification-provider', countryCode: 'CA', city: 'Toronto' },
		});
		expect(saved).not.toHaveProperty('ip');
		expect(await model.countDocuments()).toBe(1);
	});
});
