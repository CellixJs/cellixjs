import { isIP } from 'node:net';
import type { GeolocationService } from '@cellix/service-geolocation-base';
import { ServiceGeolocationDbIpHosted } from '@ocom/service-geolocation-dbip-hosted';
import { ServiceGeolocationDbIpMmdb } from '@ocom/service-geolocation-dbip-mmdb';
import { ServiceGeolocationIp2LocationBin } from '@ocom/service-geolocation-ip2location-bin';
import { ServiceGeolocationIp2LocationHosted } from '@ocom/service-geolocation-ip2location-hosted';
import { ServiceGeolocationIpInfoHosted } from '@ocom/service-geolocation-ipinfo-hosted';
import { ServiceGeolocationIpInfoLite } from '@ocom/service-geolocation-ipinfo-lite';
import { ServiceGeolocationIpInfoMmdb } from '@ocom/service-geolocation-ipinfo-mmdb';
import { ServiceGeolocationMaxMindHosted } from '@ocom/service-geolocation-maxmind-hosted';
import { ServiceGeolocationMaxMindMmdb } from '@ocom/service-geolocation-maxmind-mmdb';

interface ProviderBenchmark {
	readonly provider: string;
	readonly samplesMs: number[];
	readonly fieldsPresent: number[];
	readonly failures: number;
}

interface LifecycleGeolocationService extends GeolocationService {
	startUp(): Promise<GeolocationService>;
	shutDown(): Promise<void>;
}

interface ProviderMeasurements {
	readonly samplesMs: number[];
	readonly fieldsPresent: number[];
	failures: number;
}

const requireValue = (name: string, value: string | undefined): string => {
	if (!value?.trim()) {
		throw new Error(`${name} is required to run this provider benchmark`);
	}
	return value;
};

const buildProviders = (): LifecycleGeolocationService[] => {
	const factories = new Map<string, () => LifecycleGeolocationService>();
	const ipinfoToken = process.env['GEOLOCATION_IPINFO_TOKEN'];
	const ipinfoLiteToken = process.env['GEOLOCATION_IPINFO_LITE_TOKEN'];
	const ipinfoDatabasePath = process.env['GEOLOCATION_IPINFO_DATABASE_PATH'];
	const maxmindAccountId = process.env['GEOLOCATION_MAXMIND_ACCOUNT_ID'];
	const maxmindLicenseKey = process.env['GEOLOCATION_MAXMIND_LICENSE_KEY'];
	const maxmindDatabasePath = process.env['GEOLOCATION_MAXMIND_DATABASE_PATH'];
	const dbipApiKey = process.env['GEOLOCATION_DBIP_API_KEY'];
	const dbipDatabasePath = process.env['GEOLOCATION_DBIP_DATABASE_PATH'];
	const ip2locationApiKey = process.env['GEOLOCATION_IP2LOCATION_API_KEY'];
	const ip2locationDatabasePath = process.env['GEOLOCATION_IP2LOCATION_DATABASE_PATH'];
	const enableIp2LocationKeyless = process.env['GEOLOCATION_IP2LOCATION_ENABLE_KEYLESS'] === 'true';

	if (ipinfoToken) factories.set('ipinfo-hosted', () => new ServiceGeolocationIpInfoHosted({ token: ipinfoToken }));
	if (ipinfoLiteToken) factories.set('ipinfo-lite', () => new ServiceGeolocationIpInfoLite({ token: ipinfoLiteToken }));
	if (ipinfoDatabasePath) factories.set('ipinfo-mmdb', () => new ServiceGeolocationIpInfoMmdb({ databasePath: ipinfoDatabasePath }));
	if (maxmindAccountId && maxmindLicenseKey) {
		factories.set('maxmind-hosted', () => new ServiceGeolocationMaxMindHosted({ accountId: maxmindAccountId, licenseKey: maxmindLicenseKey }));
	}
	if (maxmindDatabasePath) factories.set('maxmind-mmdb', () => new ServiceGeolocationMaxMindMmdb({ databasePath: maxmindDatabasePath }));
	if (dbipApiKey) factories.set('dbip-hosted', () => new ServiceGeolocationDbIpHosted({ apiKey: dbipApiKey }));
	if (dbipDatabasePath) factories.set('dbip-mmdb', () => new ServiceGeolocationDbIpMmdb({ databasePath: dbipDatabasePath }));
	if (ip2locationApiKey || enableIp2LocationKeyless) {
		factories.set('ip2location-hosted', () => new ServiceGeolocationIp2LocationHosted(ip2locationApiKey ? { apiKey: ip2locationApiKey } : {}));
	}
	if (ip2locationDatabasePath) {
		factories.set('ip2location-bin', () => new ServiceGeolocationIp2LocationBin({ databasePath: ip2locationDatabasePath }));
	}

	const requested = process.env['GEOLOCATION_CAGEMATCH_PROVIDERS']
		?.split(',')
		.map((provider) => provider.trim().toLowerCase())
		.filter(Boolean);
	const selected = requested ?? [...factories.keys()];
	if (selected.length < 2) {
		throw new Error('Configure at least two providers, or select at least two with GEOLOCATION_CAGEMATCH_PROVIDERS');
	}
	const missing = selected.filter((provider) => !factories.has(provider));
	if (missing.length > 0) {
		throw new Error(`Selected provider configuration is missing or unsupported: ${missing.join(', ')}`);
	}
	return selected.map((provider) => {
		const createProvider = factories.get(provider);
		if (!createProvider) {
			throw new Error(`Selected provider configuration is missing or unsupported: ${provider}`);
		}
		return createProvider();
	});
};

const percentile = (samples: number[], fraction: number): number => {
	const sorted = [...samples].sort((left, right) => left - right);
	return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * fraction) - 1)] ?? 0;
};

const benchmarkProvider = async (provider: LifecycleGeolocationService, ip: string, iterations: number): Promise<ProviderBenchmark> => {
	await provider.startUp();
	try {
		const measurements = await Array.from({ length: iterations }).reduce<Promise<ProviderMeasurements>>(
			async (pendingMeasurements) => {
				const current = await pendingMeasurements;
				const startedAt = performance.now();
				try {
					const result = await provider.lookup(ip);
					current.samplesMs.push(performance.now() - startedAt);
					current.fieldsPresent.push(result ? Object.keys(result).filter((key) => key !== 'provider').length : 0);
				} catch {
					current.failures += 1;
				}
				return current;
			},
			Promise.resolve<ProviderMeasurements>({ samplesMs: [], fieldsPresent: [], failures: 0 }),
		);
		return { provider: provider.provider, ...measurements };
	} finally {
		await provider.shutDown();
	}
};

const run = async (): Promise<void> => {
	const ip = requireValue('GEOLOCATION_CAGEMATCH_IP', process.env['GEOLOCATION_CAGEMATCH_IP']);
	if (isIP(ip) === 0) {
		throw new Error('GEOLOCATION_CAGEMATCH_IP must be a valid IPv4 or IPv6 address');
	}
	const iterations = Math.max(1, Number.parseInt(process.env['GEOLOCATION_CAGEMATCH_ITERATIONS'] ?? '5', 10) || 5);
	const providers = buildProviders();

	const results = await providers.reduce<Promise<ProviderBenchmark[]>>(async (pendingResults, provider) => [...(await pendingResults), await benchmarkProvider(provider, ip, iterations)], Promise.resolve([]));

	console.log(
		JSON.stringify(
			{
				generatedAt: new Date().toISOString(),
				iterations,
				ipAddressIncluded: false,
				results: results.map(({ provider, samplesMs, fieldsPresent, failures }) => ({
					provider,
					successfulSamples: samplesMs.length,
					failures,
					meanLatencyMs: samplesMs.length ? samplesMs.reduce((total, sample) => total + sample, 0) / samplesMs.length : null,
					p50LatencyMs: samplesMs.length ? percentile(samplesMs, 0.5) : null,
					p95LatencyMs: samplesMs.length ? percentile(samplesMs, 0.95) : null,
					meanOptionalFieldsPresent: fieldsPresent.length ? fieldsPresent.reduce((total, count) => total + count, 0) / fieldsPresent.length : null,
				})),
			},
			null,
			2,
		),
	);
};

await run();
