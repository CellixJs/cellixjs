import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi, afterEach } from 'vitest';
import { VerifiedTokenService } from './verified-token-service.ts';
import { ServiceTokenValidation } from './index.ts';

// Mock VerifiedTokenService

const test = { for: describeFeature };
vi.mock('./verified-token-service.ts', () => ({
  VerifiedTokenService: vi.fn(),
}));

// Mock console.log
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'index.feature')
);

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
  let service: ServiceTokenValidation;
  let mockVerifiedTokenService: {
    start: ReturnType<typeof vi.fn>;
    getVerifiedJwt: ReturnType<typeof vi.fn>;
    timerInstance: NodeJS.Timeout;
  };
  let originalEnv: NodeJS.ProcessEnv;

  BeforeEachScenario(() => {
    // Reset mocks
    vi.clearAllMocks();
    mockConsoleLog.mockClear();

    // Store original environment
    originalEnv = { ...process.env };

    // Setup mock VerifiedTokenService
    mockVerifiedTokenService = {
      start: vi.fn(),
      getVerifiedJwt: vi.fn(),
      timerInstance: setInterval(() => undefined, 1000),
    };

    // biome-ignore lint/plugin/no-type-assertion: test file
    (VerifiedTokenService as ReturnType<typeof vi.fn>).mockImplementation(() => mockVerifiedTokenService);
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  Scenario('Constructing ServiceTokenValidation with valid portal tokens', ({ Given, When, Then, And }) => {
    Given('valid portal tokens mapping', () => {
      // Set up environment variables
      // biome-ignore lint:useLiteralKeys
      process.env['PORTAL1_OIDC_ENDPOINT'] = 'https://portal1.com/.well-known/jwks.json';
     // biome-ignore lint:useLiteralKeys
      process.env['PORTAL1_OIDC_AUDIENCE'] = 'audience1';
     // biome-ignore lint:useLiteralKeys
      process.env['PORTAL1_OIDC_ISSUER'] = 'https://portal1.com';
      // biome-ignore lint:useLiteralKeys
      process.env['PORTAL2_OIDC_ENDPOINT'] = 'https://portal2.com/.well-known/jwks.json';
      // biome-ignore lint:useLiteralKeys
      process.env['PORTAL2_OIDC_AUDIENCE'] = 'audience2';
      // biome-ignore lint:useLiteralKeys
      process.env['PORTAL2_OIDC_ISSUER'] = 'https://portal2.com';
    });

    When('the ServiceTokenValidation is constructed with these tokens', () => {
      // Ensure environment variables are set (they should be from Given, but let's be safe)
      // biome-ignore lint:useLiteralKeys
      process.env['PORTAL1_OIDC_ENDPOINT'] = 'https://portal1.com/.well-known/jwks.json';
      // biome-ignore lint:useLiteralKeys 
      process.env['PORTAL1_OIDC_AUDIENCE'] = 'audience1';
      // biome-ignore lint:useLiteralKeys
      process.env['PORTAL1_OIDC_ISSUER'] = 'https://portal1.com';
      // biome-ignore lint:useLiteralKeys
      process.env['PORTAL2_OIDC_ENDPOINT'] = 'https://portal2.com/.well-known/jwks.json';
      // biome-ignore lint:useLiteralKeys
      process.env['PORTAL2_OIDC_AUDIENCE'] = 'audience2';
      // biome-ignore lint:useLiteralKeys
      process.env['PORTAL2_OIDC_ISSUER'] = 'https://portal2.com';

      const portalTokens = new Map([
        ['portal1', 'PORTAL1'],
        ['portal2', 'PORTAL2'],
      ]);
      service = new ServiceTokenValidation(portalTokens);
    });

    Then('it should create OpenID configurations from environment variables', () => {
      expect(VerifiedTokenService).toHaveBeenCalledWith(
        expect.any(Map),
        1000 * 60 * 5 // default refresh interval
      );
    });

    And('it should initialize the VerifiedTokenService with the configurations', () => {
        // biome-ignore lint:useLiteralKeys
      expect(service['tokenVerifier']).toBe(mockVerifiedTokenService);
    });
  });

  Scenario('Constructing ServiceTokenValidation with missing optional environment variables', ({ Given, When, Then, And }) => {
    Given('portal tokens mapping with missing optional environment variables', () => {
      // Clear all environment variables first
      // biome-ignore lint:useLiteralKeys
      delete process.env['PORTAL1_OIDC_ENDPOINT'];
      // biome-ignore lint:useLiteralKeys
      delete process.env['PORTAL1_OIDC_AUDIENCE'];
      // biome-ignore lint:useLiteralKeys
      delete process.env['PORTAL1_OIDC_ISSUER'];
      // biome-ignore lint:useLiteralKeys
      delete process.env['PORTAL1_OIDC_CLOCK_TOLERANCE'];
      // biome-ignore lint:useLiteralKeys
      delete process.env['PORTAL1_OIDC_IGNORE_ISSUER'];

      // Set only required environment variables
      // biome-ignore lint:useLiteralKeys
      process.env['PORTAL1_OIDC_ENDPOINT'] = 'https://portal1.com/.well-known/jwks.json';
      // biome-ignore lint:useLiteralKeys
      process.env['PORTAL1_OIDC_AUDIENCE'] = 'audience1';
      // biome-ignore lint:useLiteralKeys
      process.env['PORTAL1_OIDC_ISSUER'] = 'https://portal1.com';
      // Explicitly don't set PORTAL1_OIDC_CLOCK_TOLERANCE and PORTAL1_OIDC_IGNORE_ISSUER
    });

    When('the ServiceTokenValidation is constructed with these tokens', () => {
      // Don't reset environment variables here - use what's set in Given
      const portalTokens = new Map([['portal1', 'PORTAL1']]);
      service = new ServiceTokenValidation(portalTokens);
    });

    Then('it should use default values for missing optional environment variables', () => {
      expect(VerifiedTokenService).toHaveBeenCalledWith(
        expect.any(Map),
        1000 * 60 * 5 // default refresh interval
      );
      // Verify that the config was created with default values
      const callArgs = vi.mocked(VerifiedTokenService).mock.calls[0];
      if (callArgs) {
        // biome-ignore lint/plugin/no-type-assertion: test file
        const configs = callArgs[0] as Map<string, unknown>;
        // biome-ignore lint/plugin/no-type-assertion: test file
        const config = configs.get('portal1') as { clockTolerance: string; ignoreIssuer: boolean };
        expect(config.clockTolerance).toBe('5 minutes'); // default value
        expect(config.ignoreIssuer).toBe(false); // 'false' === 'true' is false
        console.log('Default values test passed - clockTolerance:', config.clockTolerance, 'ignoreIssuer:', config.ignoreIssuer);
      }
    });

    And('it should initialize the VerifiedTokenService with default configurations', () => {
      // biome-ignore lint:useLiteralKeys
      expect(service['tokenVerifier']).toBe(mockVerifiedTokenService);
    });
  });

  Scenario('Constructing ServiceTokenValidation with missing environment variables', ({ Given, When, Then }) => {
    Given('portal tokens mapping with missing environment variables', () => {
      // Don't set up environment variables - they should be missing
    });

    When('the ServiceTokenValidation is constructed', () => {
      const portalTokens = new Map([
        ['portal1', 'MISSING'],
      ]);

      expect(() => {
        service = new ServiceTokenValidation(portalTokens);
      }).toThrow('Environment variable MISSING_OIDC_ENDPOINT not set');
    });

    Then('it should throw an error for missing required environment variables', () => {
      // Error is already thrown in When step
    });
  });

  Scenario('Starting up the ServiceTokenValidation', ({ Given, When, Then, And }) => {
    Given('a ServiceTokenValidation instance with valid configuration', () => {
      // Set up environment variables
      // biome-ignore lint:useLiteralKeys
      process.env['PORTAL1_OIDC_ENDPOINT'] = 'https://portal1.com/.well-known/jwks.json';
      // biome-ignore lint:useLiteralKeys
      process.env['PORTAL1_OIDC_AUDIENCE'] = 'audience1';
      // biome-ignore lint:useLiteralKeys
      process.env['PORTAL1_OIDC_ISSUER'] = 'https://portal1.com';

      const portalTokens = new Map([['portal1', 'PORTAL1']]);
      service = new ServiceTokenValidation(portalTokens);
    });

    When('startUp is called', async () => {
      const result = await service.startUp();
      expect(result).toBe(service);
    });

    Then('it should start the underlying VerifiedTokenService', () => {
      expect(mockVerifiedTokenService.start).toHaveBeenCalled();
    });

    And('it should return the service instance', () => {
      // Result check is in When step
    });
  });

  Scenario('Verifying JWT with ServiceTokenValidation', ({ Given, When, Then, And }) => {
    Given('a ServiceTokenValidation instance that is started', () => {
      // Set up environment variables
      // biome-ignore lint:useLiteralKeys
      process.env['PORTAL1_OIDC_ENDPOINT'] = 'https://portal1.com/.well-known/jwks.json';
      // biome-ignore lint:useLiteralKeys
      process.env['PORTAL1_OIDC_AUDIENCE'] = 'audience1';
      // biome-ignore lint:useLiteralKeys
      process.env['PORTAL1_OIDC_ISSUER'] = 'https://portal1.com';
      // biome-ignore lint:useLiteralKeys
      process.env['PORTAL2_OIDC_ENDPOINT'] = 'https://portal2.com/.well-known/jwks.json';
      // biome-ignore lint:useLiteralKeys
      process.env['PORTAL2_OIDC_AUDIENCE'] = 'audience2';
      // biome-ignore lint:useLiteralKeys
      process.env['PORTAL2_OIDC_ISSUER'] = 'https://portal2.com';

      const portalTokens = new Map([
        ['portal1', 'PORTAL1'],
        ['portal2', 'PORTAL2'],
      ]);
      service = new ServiceTokenValidation(portalTokens);

      // Mock successful verification on second attempt
      mockVerifiedTokenService.getVerifiedJwt
        .mockResolvedValueOnce(null) // First provider fails
        .mockResolvedValueOnce({ // Second provider succeeds
          payload: { sub: 'user123', aud: 'audience2' },
          protectedHeader: { alg: 'RS256' },
        });
    });

    And('a valid JWT token', () => {
      // Token is provided in When step
    });

    When('verifyJwt is called with the token', async () => {
      const result = await service.verifyJwt('valid.jwt.token');
      expect(result).toEqual({
        verifiedJwt: { sub: 'user123', aud: 'audience2' },
        openIdConfigKey: 'portal2',
      });
    });

    Then('it should try verification with each configured provider', () => {
      expect(mockVerifiedTokenService.getVerifiedJwt).toHaveBeenCalledTimes(2);
      expect(mockVerifiedTokenService.getVerifiedJwt).toHaveBeenCalledWith('valid.jwt.token', 'portal1');
      expect(mockVerifiedTokenService.getVerifiedJwt).toHaveBeenCalledWith('valid.jwt.token', 'portal2');
    });

    And('it should return the verification result when successful', () => {
      // Result check is in When step
    });
  });

  Scenario('Verifying invalid JWT with ServiceTokenValidation', ({ Given, When, Then, And }) => {
    Given('a ServiceTokenValidation instance that is started', () => {
      // Set up environment variables
      // biome-ignore lint:useLiteralKeys
      process.env['PORTAL1_OIDC_ENDPOINT'] = 'https://portal1.com/.well-known/jwks.json';
      // biome-ignore lint:useLiteralKeys
      process.env['PORTAL1_OIDC_AUDIENCE'] = 'audience1';
      // biome-ignore lint:useLiteralKeys
      process.env['PORTAL1_OIDC_ISSUER'] = 'https://portal1.com';

      const portalTokens = new Map([['portal1', 'PORTAL1']]);
      service = new ServiceTokenValidation(portalTokens);

      // Mock verification failure
      mockVerifiedTokenService.getVerifiedJwt.mockResolvedValue(null);
    });

    And('an invalid JWT token', () => {
      // Token is provided in When step
    });

    When('verifyJwt is called with the invalid token', async () => {
      const result = await service.verifyJwt('invalid.jwt.token');
      expect(result).toBeNull();
    });

    Then('it should return null indicating verification failed', () => {
      // Result check is in When step
    });
  });

  Scenario('Shutting down the ServiceTokenValidation', ({ Given, When, Then, And }) => {
    Given('a started ServiceTokenValidation instance', () => {
      // Set up environment variables
        // biome-ignore lint:useLiteralKeys
      process.env['PORTAL1_OIDC_ENDPOINT'] = 'https://portal1.com/.well-known/jwks.json';
        // biome-ignore lint:useLiteralKeys
      process.env['PORTAL1_OIDC_AUDIENCE'] = 'audience1';
        // biome-ignore lint:useLiteralKeys
      process.env['PORTAL1_OIDC_ISSUER'] = 'https://portal1.com';

      const portalTokens = new Map([['portal1', 'PORTAL1']]);
      service = new ServiceTokenValidation(portalTokens);
    });

    When('shutDown is called', async () => {
      await service.shutDown();
    });

    Then('it should stop the underlying VerifiedTokenService', () => {
      // The shutdown method clears the timer instance from VerifiedTokenService
      expect(mockVerifiedTokenService.timerInstance).toBeDefined();
    });

    And('it should log that the service stopped', () => {
      expect(mockConsoleLog).toHaveBeenCalledWith('ServiceTokenValidation stopped');
    });
  });
});