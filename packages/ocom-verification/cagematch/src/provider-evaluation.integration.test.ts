import { getRequestIpHeaders } from '@cellix/api-core';
import type { GeolocationLookupResult, GeolocationService } from '@cellix/service-geolocation-base';
import { createGeolocationApplicationService } from '@ocom/application-services';
import { Persistence } from '@ocom/persistence';
import { ServiceGeolocationDbIpHosted } from '@ocom/service-geolocation-dbip-hosted';
import { ServiceGeolocationDbIpMmdb } from '@ocom/service-geolocation-dbip-mmdb';
import { ServiceGeolocationIp2LocationBin } from '@ocom/service-geolocation-ip2location-bin';
import { ServiceGeolocationIp2LocationHosted } from '@ocom/service-geolocation-ip2location-hosted';
import { ServiceGeolocationIpInfoHosted } from '@ocom/service-geolocation-ipinfo-hosted';
import { ServiceGeolocationIpInfoLite } from '@ocom/service-geolocation-ipinfo-lite';
import { ServiceGeolocationIpInfoMmdb } from '@ocom/service-geolocation-ipinfo-mmdb';
import { ServiceGeolocationMaxMindHosted } from '@ocom/service-geolocation-maxmind-hosted';
import { ServiceGeolocationMaxMindMmdb } from '@ocom/service-geolocation-maxmind-mmdb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

interface EvaluationService extends GeolocationService {
	startUp(): Promise<GeolocationService>;
	shutDown(): Promise<void>;
}

interface ProviderFixture {
	readonly provider: string;
	readonly expected: GeolocationLookupResult;
	readonly expectedScore: number;
	create(observedIps: string[]): EvaluationService;
}

const trustedIp = '203.0.113.42';
const forgedForwardedIp = '198.51.100.99';
const commonLocation = {
	countryCode: 'CA',
	region: 'Ontario',
	city: 'Toronto',
	latitude: 43.6532,
	longitude: -79.3832,
};
const maxMindCityResponse = {
	country: { isoCode: 'CA', names: { en: 'Canada' } },
	city: { names: { en: 'Toronto' } },
	subdivisions: [{ names: { en: 'Ontario' } }],
	location: { latitude: 43.6532, longitude: -79.3832, accuracyRadius: 10 },
};

interface RubricEvidence {
	readonly trustedIngressSelected: boolean;
	readonly forgedForwardedHeaderIgnored: boolean;
	readonly addressListRejected: boolean;
	readonly observationPersisted: boolean;
	readonly sourceIpOmitted: boolean;
}

const scoreFixture = (result: GeolocationLookupResult, evidence: RubricEvidence): number => {
	const commonFields = ['countryCode', 'region', 'city', 'latitude', 'longitude'] as const;
	return (
		(evidence.trustedIngressSelected ? 15 : 0) +
		(evidence.forgedForwardedHeaderIgnored ? 10 : 0) +
		(evidence.addressListRejected ? 10 : 0) +
		commonFields.filter((field) => result[field] !== undefined).length * 6 +
		(result.countryName !== undefined ? 10 : 0) +
		(result.accuracyRadiusKm !== undefined ? 10 : 0) +
		(evidence.observationPersisted ? 10 : 0) +
		(evidence.sourceIpOmitted ? 5 : 0)
	);
};

const providerFixtures: ProviderFixture[] = [
	{
		provider: 'dbip-hosted',
		expected: { provider: 'dbip-hosted', ...commonLocation, countryName: 'Canada' },
		expectedScore: 90,
		create: (observedIps) =>
			new ServiceGeolocationDbIpHosted({ apiKey: 'fake-dbip-key' }, (input: string | URL | Request) => {
				observedIps.push(decodeURIComponent(new URL(String(input)).pathname.split('/').at(-1) ?? ''));
				return Promise.resolve(new Response(JSON.stringify({ countryCode: 'CA', countryName: 'Canada', stateProv: 'Ontario', city: 'Toronto', latitude: 43.6532, longitude: -79.3832 }), { status: 200 }));
			}),
	},
	{
		provider: 'dbip-mmdb',
		expected: { provider: 'dbip-mmdb', ...commonLocation, countryName: 'Canada', accuracyRadiusKm: 10 },
		expectedScore: 100,
		create: (observedIps) =>
			new ServiceGeolocationDbIpMmdb(
				{ databasePath: '/fake/dbip-city-lite.mmdb' },
				async () =>
					({
						city: (ip: string) => {
							observedIps.push(ip);
							return maxMindCityResponse;
						},
					}) as never,
			),
	},
	{
		provider: 'ipinfo-hosted',
		expected: { provider: 'ipinfo-hosted', ...commonLocation },
		expectedScore: 80,
		create: (observedIps) =>
			new ServiceGeolocationIpInfoHosted({ token: 'fake-ipinfo-token' }, (input) => {
				observedIps.push(decodeURIComponent(new URL(String(input)).pathname.split('/')[1] ?? ''));
				return Promise.resolve(
					new Response(JSON.stringify({ country: 'CA', region: 'Ontario', city: 'Toronto', loc: '43.6532,-79.3832' }), {
						status: 200,
					}),
				);
			}),
	},
	{
		provider: 'ipinfo-lite',
		expected: { provider: 'ipinfo-lite', countryCode: 'CA', countryName: 'Canada' },
		expectedScore: 66,
		create: (observedIps) =>
			new ServiceGeolocationIpInfoLite({ token: 'fake-ipinfo-lite-token' }, (input) => {
				observedIps.push(decodeURIComponent(new URL(String(input)).pathname.split('/').at(-1) ?? ''));
				return Promise.resolve(new Response(JSON.stringify({ ip: trustedIp, country_code: 'CA', country: 'Canada', continent_code: 'NA', continent: 'North America' }), { status: 200 }));
			}),
	},
	{
		provider: 'ipinfo-mmdb',
		expected: { provider: 'ipinfo-mmdb', ...commonLocation, countryName: 'Canada' },
		expectedScore: 90,
		create: (observedIps) =>
			new ServiceGeolocationIpInfoMmdb({ databasePath: '/fake/ipinfo-core.mmdb' }, async () => ({
				get: (ip: string) => {
					observedIps.push(ip);
					return { country: 'Canada', country_code: 'CA', region: 'Ontario', city: 'Toronto', latitude: 43.6532, longitude: -79.3832 };
				},
			})),
	},
	{
		provider: 'ip2location-hosted',
		expected: { provider: 'ip2location-hosted', ...commonLocation, countryName: 'Canada' },
		expectedScore: 90,
		create: (observedIps) =>
			new ServiceGeolocationIp2LocationHosted({ apiKey: 'fake-ip2location-key' }, (input: string | URL | Request) => {
				observedIps.push(new URL(String(input)).searchParams.get('ip') ?? '');
				return Promise.resolve(new Response(JSON.stringify({ country_code: 'CA', country_name: 'Canada', region_name: 'Ontario', city_name: 'Toronto', latitude: 43.6532, longitude: -79.3832 }), { status: 200 }));
			}),
	},
	{
		provider: 'ip2location-bin',
		expected: { provider: 'ip2location-bin', ...commonLocation, countryName: 'Canada' },
		expectedScore: 90,
		create: (observedIps) =>
			new ServiceGeolocationIp2LocationBin({ databasePath: '/fake/IP2LOCATION.BIN' }, () => ({
				openAsync: async () => undefined,
				getAllAsync: (ip: string) => {
					observedIps.push(ip);
					return Promise.resolve({ countryShort: 'CA', countryLong: 'Canada', region: 'Ontario', city: 'Toronto', latitude: 43.6532, longitude: -79.3832 });
				},
				closeAsync: async () => 0,
			})),
	},
	{
		provider: 'maxmind-hosted',
		expected: {
			provider: 'maxmind-hosted',
			...commonLocation,
			countryName: 'Canada',
			accuracyRadiusKm: 10,
		},
		expectedScore: 100,
		create: (observedIps) =>
			new ServiceGeolocationMaxMindHosted(
				{ accountId: 'fake-account-id', licenseKey: 'fake-license-key' },
				() =>
					({
						city: (ip: string) => {
							observedIps.push(ip);
							return Promise.resolve(maxMindCityResponse);
						},
					}) as never,
			),
	},
	{
		provider: 'maxmind-mmdb',
		expected: {
			provider: 'maxmind-mmdb',
			...commonLocation,
			countryName: 'Canada',
			accuracyRadiusKm: 10,
		},
		expectedScore: 100,
		create: (observedIps) =>
			new ServiceGeolocationMaxMindMmdb(
				{ databasePath: '/fake/GeoLite2-City.mmdb' },
				async () =>
					({
						city: (ip: string) => {
							observedIps.push(ip);
							return maxMindCityResponse;
						},
					}) as never,
			),
	},
];

const requestHeaders = (azureClientIp: string) =>
	getRequestIpHeaders({
		headers: new Headers({
			'x-azure-clientip': azureClientIp,
			'x-forwarded-for': forgedForwardedIp,
		}),
	} as Parameters<typeof getRequestIpHeaders>[0]);

describe('geolocation provider comparison at the HTTP ingress boundary', () => {
	let mongoServer: MongoMemoryServer;
	let lookupStore: ReturnType<typeof Persistence>['geolocationLookupStore'] | undefined;

	beforeAll(async () => {
		mongoServer = await MongoMemoryServer.create();
		await mongoose.connect(mongoServer.getUri());
		lookupStore = Persistence({ service: mongoose } as Parameters<typeof Persistence>[0]).geolocationLookupStore;
	});

	afterAll(async () => {
		await mongoose.disconnect();
		await mongoServer.stop();
	});

	it.each(providerFixtures)('$provider passes the full request-path rubric', async (fixture) => {
		if (!lookupStore) {
			throw new Error('The geolocation lookup store was not initialized');
		}
		const model = mongoose.model('GeolocationLookup');
		await model.deleteMany({});

		const observedIps: string[] = [];
		const provider = fixture.create(observedIps);
		await provider.startUp();
		try {
			const applicationService = createGeolocationApplicationService(provider, lookupStore, 'azureClientIp');
			const result = await applicationService.captureRequest(requestHeaders(trustedIp));

			const trustedIngressSelected = observedIps.length === 1 && observedIps[0] === trustedIp;
			const forgedForwardedHeaderIgnored = trustedIngressSelected;
			expect(trustedIngressSelected).toBe(true);
			expect(result).toEqual(fixture.expected);

			const saved = await model.findOne({}).lean();
			expect(saved).toMatchObject({ provider: fixture.provider, result: fixture.expected, lookedUpAt: expect.any(Date) });
			expect(await model.countDocuments()).toBe(1);
			expect(result).not.toBeNull();
			if (!result || !saved) {
				throw new Error('The provider result or persisted observation failed rubric verification');
			}
			const observationPersisted = (await model.countDocuments()) === 1;
			const sourceIpOmitted = !Object.hasOwn(saved, 'ip');
			expect(sourceIpOmitted).toBe(true);

			observedIps.length = 0;
			await model.deleteMany({});
			const listResult = await applicationService.captureRequest(requestHeaders(`${trustedIp}, 203.0.113.43`));
			const addressListRejected = listResult === null && observedIps.length === 0 && (await model.countDocuments()) === 0;
			expect(addressListRejected).toBe(true);

			expect(
				scoreFixture(result, {
					trustedIngressSelected,
					forgedForwardedHeaderIgnored,
					addressListRejected,
					observationPersisted,
					sourceIpOmitted,
				}),
			).toBe(fixture.expectedScore);
		} finally {
			await provider.shutDown();
		}
	});
});
