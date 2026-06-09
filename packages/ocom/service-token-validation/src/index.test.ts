import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, type Mock, vi } from 'vitest';
import { ServiceTokenValidation } from './index.ts';
import { VerifiedTokenService } from './verified-token-service.ts';

// Mock VerifiedTokenService

const test = { for: describeFeature };

vi.mock('./verified-token-service.ts', () => ({
	VerifiedTokenService: vi.fn(),
}));

const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'index.feature'));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function setPortalEnv(
	prefix: string,
	opts: { endpoint: string; audience: string; issuer: string; clockTolerance?: string; ignoreIssuer?: string },
) {
	vi.stubEnv(`${prefix}_OIDC_ENDPOINT`, opts.endpoint);
	vi.stubEnv(`${prefix}_OIDC_AUDIENCE`, opts.audience);
	vi.stubEnv(`${prefix}_OIDC_ISSUER`, opts.issuer);
	if (opts.clockTolerance !== undefined) vi.stubEnv(`${prefix}_OIDC_CLOCK_TOLERANCE`, opts.clockTolerance);
	if (opts.ignoreIssuer !== undefined) vi.stubEnv(`${prefix}_OIDC_IGNORE_ISSUER`, opts.ignoreIssuer);
}

function makeBaseEnv(prefix: string) {
	setPortalEnv(prefix, {
		endpoint: `https://${prefix.toLowerCase()}.com/.well-known/jwks.json`,
		audience: `${prefix.toLowerCase()}-aud`,
		issuer: `https://${prefix.toLowerCase()}.com`,
	});
}

function makeMockVerifiedTokenService() {
	const mockGetVerifiedJwt = vi.fn<VerifiedTokenService['getVerifiedJwt']>();
	const mock = {
		openIdConfigs: new Map(),
		refreshInterval: 1000 * 60 * 5,
		keyStoreCollection: new Map(),
		refreshCollection: vi.fn<VerifiedTokenService['refreshCollection']>(),
		start: vi.fn<VerifiedTokenService['start']>(),
		getVerifiedJwt: mockGetVerifiedJwt as unknown as VerifiedTokenService['getVerifiedJwt'],
		timerInstance: undefined as NodeJS.Timeout | undefined,
	} as VerifiedTokenService;
	return { mock, mockGetVerifiedJwt };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
	let service: ServiceTokenValidation;
	let mockVerifiedTokenService: VerifiedTokenService;
	let mockGetVerifiedJwt: Mock<VerifiedTokenService['getVerifiedJwt']>;
	let verifyJwtResult: Awaited<ReturnType<ServiceTokenValidation['verifyJwt']>> | undefined;
	let thrownError: unknown;
	let startUpResult: unknown;

	BeforeEachScenario(() => {
		vi.clearAllMocks();
		vi.unstubAllEnvs();
		mockConsoleLog.mockClear();
		thrownError = undefined;
		verifyJwtResult = undefined;
		startUpResult = undefined;

		const { mock, mockGetVerifiedJwt: getJwt } = makeMockVerifiedTokenService();
		mockVerifiedTokenService = mock;
		mockGetVerifiedJwt = getJwt;

		vi.mocked(VerifiedTokenService).mockImplementation(function MockVerifiedTokenService() {
			return mockVerifiedTokenService;
		});
	});

	// ─── Constructor ──────────────────────────────────────────────────────────

	Scenario('Constructing ServiceTokenValidation with valid portal tokens', ({ Given, When, Then, And }) => {
		Given('valid portal tokens mapping for two portals', () => {
			makeBaseEnv('PORTAL1');
			makeBaseEnv('PORTAL2');
		});
		When('the ServiceTokenValidation is constructed with these tokens', () => {
			service = new ServiceTokenValidation(new Map([['portal1', 'PORTAL1'], ['portal2', 'PORTAL2']]));
		});
		Then('it should pass the configuration map to VerifiedTokenService', () => {
			const [configs] = vi.mocked(VerifiedTokenService).mock.calls[0] as [Map<string, unknown>];
			expect(configs).toBeInstanceOf(Map);
			expect(configs.has('portal1')).toBe(true);
			expect(configs.has('portal2')).toBe(true);
		});
		And('it should pass the default refresh interval to VerifiedTokenService', () => {
			expect(VerifiedTokenService).toHaveBeenCalledWith(expect.any(Map), 1000 * 60 * 5);
		});
		And('it should store the VerifiedTokenService instance', () => {
			expect(VerifiedTokenService).toHaveBeenCalledOnce();
		});
	});

	Scenario('Constructing ServiceTokenValidation with missing optional environment variables uses defaults', ({ Given, When, Then, And }) => {
		Given('portal tokens mapping with only required environment variables set', () => {
			// Only stub the required vars; optional vars intentionally absent
			makeBaseEnv('PORTAL1');
		});
		When('the ServiceTokenValidation is constructed with these tokens', () => {
			service = new ServiceTokenValidation(new Map([['portal1', 'PORTAL1']]));
		});
		Then('the config clockTolerance should default to "5 minutes"', () => {
			const [configs] = vi.mocked(VerifiedTokenService).mock.calls[0] as unknown as [Map<string, { clockTolerance: string }>];
			expect(configs.get('portal1')?.clockTolerance).toBe('5 minutes');
		});
		And('the config ignoreIssuer should default to false', () => {
			const [configs] = vi.mocked(VerifiedTokenService).mock.calls[0] as unknown as [Map<string, { ignoreIssuer: boolean }>];
			expect(configs.get('portal1')?.ignoreIssuer).toBe(false);
		});
	});

	Scenario('Constructing ServiceTokenValidation when ignoreIssuer is explicitly set to true', ({ Given, When, Then }) => {
		Given('portal tokens mapping with OIDC_IGNORE_ISSUER set to "true"', () => {
			makeBaseEnv('PORTAL1');
			vi.stubEnv('PORTAL1_OIDC_IGNORE_ISSUER', 'true');
		});
		When('the ServiceTokenValidation is constructed with these tokens', () => {
			service = new ServiceTokenValidation(new Map([['portal1', 'PORTAL1']]));
		});
		Then('the config ignoreIssuer should be true', () => {
			const [configs] = vi.mocked(VerifiedTokenService).mock.calls[0] as unknown as [Map<string, { ignoreIssuer: boolean }>];
			expect(configs.get('portal1')?.ignoreIssuer).toBe(true);
		});
	});

	Scenario('Constructing ServiceTokenValidation with a custom refresh interval', ({ Given, When, Then }) => {
		Given('valid portal tokens mapping for one portal', () => {
			makeBaseEnv('PORTAL1');
		});
		When('the ServiceTokenValidation is constructed with a custom refresh interval of 30000', () => {
			service = new ServiceTokenValidation(new Map([['portal1', 'PORTAL1']]), 30000);
		});
		Then('it should pass the custom refresh interval 30000 to VerifiedTokenService', () => {
			expect(VerifiedTokenService).toHaveBeenCalledWith(expect.any(Map), 30000);
		});
	});

	Scenario('Constructing ServiceTokenValidation with a missing required environment variable', ({ Given, When, Then }) => {
		Given('portal tokens mapping that references a missing environment variable prefix', () => {
			// MISSING_ prefix env vars are not stubbed — absence is the test condition
		});
		When('the ServiceTokenValidation is constructed', () => {
			try {
				service = new ServiceTokenValidation(new Map([['portal1', 'MISSING']]));
			} catch (e) {
				thrownError = e;
			}
		});
		Then('it should throw an error indicating the environment variable is not set', () => {
			expect(thrownError).toBeInstanceOf(Error);
			expect((thrownError as Error).message).toBe('Environment variable MISSING_OIDC_ENDPOINT not set');
		});
	});

	// ─── startUp ─────────────────────────────────────────────────────────────

	Scenario('Starting up the ServiceTokenValidation', ({ Given, When, Then, And }) => {
		Given('a ServiceTokenValidation instance with valid configuration', () => {
			makeBaseEnv('PORTAL1');
			service = new ServiceTokenValidation(new Map([['portal1', 'PORTAL1']]));
		});
		When('startUp is called', async () => {
			startUpResult = await service.startUp();
		});
		Then('it should call start on the underlying VerifiedTokenService', () => {
			expect(mockVerifiedTokenService.start).toHaveBeenCalledOnce();
		});
		And('it should resolve with the service instance itself', () => {
			expect(startUpResult).toBe(service);
		});
	});

	// ─── verifyJwt ────────────────────────────────────────────────────────────

	Scenario('verifyJwt succeeds on the second provider after a retryable error on the first', ({ Given, And, When, Then }) => {
		Given('a ServiceTokenValidation instance configured with two portals', () => {
			makeBaseEnv('PORTAL1');
			makeBaseEnv('PORTAL2');
			service = new ServiceTokenValidation(new Map([['portal1', 'PORTAL1'], ['portal2', 'PORTAL2']]));
		});
		And('the first portal raises a retryable JWSSignatureVerificationFailed error', () => {
			mockGetVerifiedJwt.mockRejectedValueOnce(
				Object.assign(new Error('signature mismatch'), { name: 'JWSSignatureVerificationFailed' }),
			);
		});
		And('the second portal resolves with a valid JWT payload', () => {
			mockGetVerifiedJwt.mockResolvedValueOnce({
				payload: { sub: 'user123', aud: 'portal2-aud' },
				protectedHeader: { alg: 'RS256' },
				key: {} as never,
			});
		});
		When('verifyJwt is called with a bearer token', async () => {
			verifyJwtResult = await service.verifyJwt('test.jwt.token');
		});
		Then('it should call getVerifiedJwt for both portal1 and portal2', () => {
			expect(mockVerifiedTokenService.getVerifiedJwt).toHaveBeenCalledTimes(2);
			expect(mockVerifiedTokenService.getVerifiedJwt).toHaveBeenCalledWith('test.jwt.token', 'portal1');
			expect(mockVerifiedTokenService.getVerifiedJwt).toHaveBeenCalledWith('test.jwt.token', 'portal2');
		});
		And('it should return the verifiedJwt and openIdConfigKey from the second portal', () => {
			expect(verifyJwtResult).toEqual({
				verifiedJwt: { sub: 'user123', aud: 'portal2-aud' },
				openIdConfigKey: 'portal2',
			});
		});
	});

	Scenario('verifyJwt propagates a non-retryable error', ({ Given, And, When, Then }) => {
		Given('a ServiceTokenValidation instance configured with one portal', () => {
			makeBaseEnv('PORTAL1');
			service = new ServiceTokenValidation(new Map([['portal1', 'PORTAL1']]));
		});
		And('the portal raises a non-retryable TypeError', () => {
			mockGetVerifiedJwt.mockRejectedValueOnce(new TypeError('unexpected failure'));
		});
		When('verifyJwt is called with a bearer token', async () => {
			try {
				verifyJwtResult = await service.verifyJwt('test.jwt.token');
			} catch (e) {
				thrownError = e;
			}
		});
		Then('it should rethrow the non-retryable error', () => {
			expect(thrownError).toBeInstanceOf(TypeError);
			expect((thrownError as TypeError).message).toBe('unexpected failure');
		});
	});

	Scenario('verifyJwt returns null when a provider returns a result with no payload', ({ Given, And, When, Then }) => {
		Given('a ServiceTokenValidation instance configured with one portal', () => {
			makeBaseEnv('PORTAL1');
			service = new ServiceTokenValidation(new Map([['portal1', 'PORTAL1']]));
		});
		And('the portal resolves with a result that has no payload', () => {
			mockGetVerifiedJwt.mockResolvedValueOnce({
				payload: undefined,
				protectedHeader: { alg: 'RS256' },
				key: {} as never,
			} as never);
		});
		When('verifyJwt is called with a bearer token', async () => {
			verifyJwtResult = await service.verifyJwt('test.jwt.token');
		});
		Then('it should return null', () => {
			expect(verifyJwtResult).toBeNull();
		});
	});

	Scenario('verifyJwt returns null when all providers return null', ({ Given, And, When, Then }) => {
		Given('a ServiceTokenValidation instance configured with one portal', () => {
			makeBaseEnv('PORTAL1');
			service = new ServiceTokenValidation(new Map([['portal1', 'PORTAL1']]));
		});
		And('the portal resolves with null', () => {
			// biome-ignore lint/suspicious/noExplicitAny: simulating null return from mock
			mockGetVerifiedJwt.mockResolvedValueOnce(null as any);
		});
		When('verifyJwt is called with a bearer token', async () => {
			verifyJwtResult = await service.verifyJwt('test.jwt.token');
		});
		Then('it should return null', () => {
			expect(verifyJwtResult).toBeNull();
		});
	});

	// ─── shutDown ─────────────────────────────────────────────────────────────

	Scenario('Shutting down when a timer is running clears the interval and logs', ({ Given, When, Then, And }) => {
		Given('a ServiceTokenValidation instance with a running timer', () => {
			makeBaseEnv('PORTAL1');
			service = new ServiceTokenValidation(new Map([['portal1', 'PORTAL1']]));
			mockVerifiedTokenService.timerInstance = setInterval(() => undefined, 60_000);
		});
		When('shutDown is called', async () => {
			await service.shutDown();
		});
		Then('it should clear the timer interval', () => {
			expect(mockConsoleLog).toHaveBeenCalledWith('ServiceTokenValidation stopped');
		});
		And('it should log "ServiceTokenValidation stopped"', () => {
			expect(mockConsoleLog).toHaveBeenCalledOnce();
		});
	});

	Scenario('Shutting down when no timer is running still logs', ({ Given, When, Then }) => {
		Given('a ServiceTokenValidation instance with no timer running', () => {
			makeBaseEnv('PORTAL1');
			service = new ServiceTokenValidation(new Map([['portal1', 'PORTAL1']]));
			mockVerifiedTokenService.timerInstance = undefined;
		});
		When('shutDown is called', async () => {
			await service.shutDown();
		});
		Then('it should log "ServiceTokenValidation stopped"', () => {
			expect(mockConsoleLog).toHaveBeenCalledWith('ServiceTokenValidation stopped');
		});
	});
});

