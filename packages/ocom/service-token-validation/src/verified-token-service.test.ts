import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { OpenIdConfig } from './verified-token-service.ts';
import { VerifiedTokenService } from './verified-token-service.ts';

// Mock jose library

const test = { for: describeFeature };
vi.mock('jose', () => ({
  createRemoteJWKSet: vi.fn(),
  jwtVerify: vi.fn(),
}));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/verified-token-service.feature')
);

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
  let service: VerifiedTokenService;
  let mockOpenIdConfigs: Map<string, OpenIdConfig>;

  BeforeEachScenario(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup mock OpenID configs
    mockOpenIdConfigs = new Map([
      ['provider1', {
        issuerUrl: 'https://provider1.com',
        oidcEndpoint: 'https://provider1.com/.well-known/jwks.json',
        audience: 'audience1',
        ignoreIssuer: false,
        clockTolerance: '5 minutes',
      }],
      ['provider2', {
        issuerUrl: 'https://provider2.com',
        oidcEndpoint: 'https://provider2.com/.well-known/jwks.json',
        audience: 'audience2',
        ignoreIssuer: true,
        clockTolerance: '10 minutes',
      }],
    ]);

    // Setup default mock implementations
    vi.mocked(createRemoteJWKSet).mockReturnValue(vi.fn() as unknown as ReturnType<typeof createRemoteJWKSet>);
    vi.mocked(jwtVerify).mockResolvedValue({
      payload: { sub: 'user123', aud: 'audience1', iss: 'https://provider1.com' },
      protectedHeader: { alg: 'RS256' },
      key: new Uint8Array(0),
    });
  });

  Scenario('Constructing VerifiedTokenService with valid OpenID configurations', ({ Given, When, Then }) => {
    Given('valid OpenID configurations for multiple providers', () => {
      // Configs are already set up in BeforeEachScenario
    });

    When('the VerifiedTokenService is constructed with these configurations', () => {
      service = new VerifiedTokenService(mockOpenIdConfigs);
    });

    Then('it should initialize the keystore collection and store the configurations', () => {
      // biome-ignore lint:useLiteralKeys
      expect(service['keyStoreCollection']).toBeInstanceOf(Map);
      // biome-ignore lint:useLiteralKeys
      expect(service['openIdConfigs']).toBe(mockOpenIdConfigs);
    });
  });

  Scenario('Constructing VerifiedTokenService with empty configurations', ({ Given, When, Then }) => {
    Given('no OpenID configurations', () => {
      mockOpenIdConfigs = new Map();
    });

    When('the VerifiedTokenService is constructed with empty configurations', () => {
      expect(() => {
        service = new VerifiedTokenService(mockOpenIdConfigs);
      }).toThrow('openIdConfigs is required');
    });

    Then('it should throw an error indicating configurations are required', () => {
      // Error is already thrown in When step
    });
  });

  Scenario('Starting the VerifiedTokenService', ({ Given, When, Then }) => {
    Given('a VerifiedTokenService instance with valid configurations', () => {
      service = new VerifiedTokenService(mockOpenIdConfigs);
    });

    When('the service is started', () => {
      service.start();
    });

    Then('it should begin periodic keystore refresh and immediately refresh the collection', () => {
      // biome-ignore lint:useLiteralKeys
      expect(service['timerInstance']).toBeDefined();
      expect(vi.mocked(createRemoteJWKSet)).toHaveBeenCalledTimes(2); // Once for each provider
      expect(vi.mocked(createRemoteJWKSet)).toHaveBeenCalledWith(new URL('https://provider1.com/.well-known/jwks.json'));
      expect(vi.mocked(createRemoteJWKSet)).toHaveBeenCalledWith(new URL('https://provider2.com/.well-known/jwks.json'));
    });
  });

  Scenario('Starting service that is already started', ({ Given, When, Then }) => {
    Given('a VerifiedTokenService instance that is already started', () => {
      service = new VerifiedTokenService(mockOpenIdConfigs);
      service.start();
      // Verify it's started
      // biome-ignore lint:useLiteralKeys
      expect(service['timerInstance']).toBeDefined();
    });

    When('start is called again', () => {
      // biome-ignore lint:useLiteralKeys
      const originalTimer = service['timerInstance'];
      service.start();
      // Timer should remain the same (no new timer created)
      // biome-ignore lint:useLiteralKeys
      expect(service['timerInstance']).toBe(originalTimer);
    });

    Then('it should not create a new timer and should return early', () => {
      // The start method should return early without creating a new timer
      // biome-ignore lint:useLiteralKeys
      expect(service['timerInstance']).toBeDefined();
      // Verify createRemoteJWKSet was not called again (only called during first start)
      expect(vi.mocked(createRemoteJWKSet)).toHaveBeenCalledTimes(2); // Only from initial start
    });
  });

  Scenario('Refreshing keystore collection', ({ Given, When, Then }) => {
    Given('a VerifiedTokenService instance with valid configurations', () => {
      service = new VerifiedTokenService(mockOpenIdConfigs);
    });

    When('the keystore collection is refreshed', () => {
      // biome-ignore lint:useLiteralKeys
      service['refreshCollection']();
    });

    Then('it should create remote JWK sets and update the keystore collection', () => {
      expect(vi.mocked(createRemoteJWKSet)).toHaveBeenCalledTimes(2);
      expect(vi.mocked(createRemoteJWKSet)).toHaveBeenCalledWith(new URL('https://provider1.com/.well-known/jwks.json'));
      expect(vi.mocked(createRemoteJWKSet)).toHaveBeenCalledWith(new URL('https://provider2.com/.well-known/jwks.json'));
      const { keyStoreCollection } = service as unknown as { keyStoreCollection: Map<string, unknown> };
      expect(keyStoreCollection.size).toBe(2);
      expect(keyStoreCollection.has('provider1')).toBe(true);
      expect(keyStoreCollection.has('provider2')).toBe(true);
    });
  });

  Scenario('Refreshing keystore collection with null configs', ({ Given, When, Then }) => {
    Given('a VerifiedTokenService instance', () => {
      service = new VerifiedTokenService(mockOpenIdConfigs);
      // Temporarily set openIdConfigs to null to test the null check
      Object.defineProperty(service, 'openIdConfigs', { value: null, writable: true });
    });

    When('the keystore collection is refreshed with null configs', () => {
      // biome-ignore lint:useLiteralKeys
      service['refreshCollection']();
    });

    Then('it should return early without processing', () => {
      // Since configs are null, createRemoteJWKSet should not be called
      expect(vi.mocked(createRemoteJWKSet)).not.toHaveBeenCalled();
    });
  });

  Scenario('Verifying a valid JWT token', ({ Given, When, Then, And }) => {
    Given('a VerifiedTokenService instance that is started', () => {
      service = new VerifiedTokenService(mockOpenIdConfigs);
      service.start();
    });

    And('a valid JWT token for a configured provider', () => {
      // Mock is already set up
    });

    When('the JWT is verified with the correct config key', async () => {
      const result = await service.getVerifiedJwt('valid.jwt.token', 'provider1');
      expect(result).toBeDefined();
    });

    Then('it should return the verified JWT payload with expected claims', () => {
      expect(vi.mocked(jwtVerify)).toHaveBeenCalledWith(
        'valid.jwt.token',
        expect.any(Function),
        {
          audience: 'audience1',
          clockTolerance: '5 minutes',
          issuer: 'https://provider1.com',
        }
      );
    });
  });

  Scenario('Verifying JWT with invalid config key', ({ Given, When, Then, And }) => {
    Given('a VerifiedTokenService instance that is started', () => {
      service = new VerifiedTokenService(mockOpenIdConfigs);
      service.start();
    });

    And('a valid JWT token', () => {
      // Mock is already set up
    });

    When('the JWT is verified with an invalid config key', async () => {
      await expect(service.getVerifiedJwt('valid.jwt.token', 'invalid-key')).rejects.toThrow('Invalid OpenIdConfig Key');
    });

    Then('it should throw an error indicating invalid config key', () => {
      // Error is already thrown in When step
    });
  });

  Scenario('Verifying JWT when service is not started', ({ Given, When, Then, And }) => {
    Given('a VerifiedTokenService instance that is not started', () => {
      service = new VerifiedTokenService(mockOpenIdConfigs);
      // Don't call start()
    });

    And('a valid JWT token', () => {
      // Mock is already set up
    });

    When('the JWT is verified', async () => {
      await expect(service.getVerifiedJwt('valid.jwt.token', 'provider1')).rejects.toThrow('VerifiedTokenService not started');
    });

    Then('it should throw an error indicating the service is not started', () => {
      // Error is already thrown in When step
    });
  });

  Scenario('Verifying JWT with issuer validation disabled', ({ Given, When, Then, And }) => {
    Given('a VerifiedTokenService instance that is started', () => {
      service = new VerifiedTokenService(mockOpenIdConfigs);
      service.start();
    });

    And('a JWT token with mismatched issuer', () => {
      // Mock is already set up
    });

    And('issuer validation is disabled for the config', () => {
      // provider2 has ignoreIssuer: true
    });

    When('the JWT is verified with the config key', async () => {
      const result = await service.getVerifiedJwt('valid.jwt.token', 'provider2');
      expect(result).toBeDefined();
    });

    Then('it should successfully verify the token despite issuer mismatch', () => {
      expect(vi.mocked(jwtVerify)).toHaveBeenCalledWith(
        'valid.jwt.token',
        expect.any(Function),
        {
          audience: 'audience2',
          clockTolerance: '10 minutes',
          // No issuer property because ignoreIssuer is true
        }
      );
    });
  });

  Scenario('Verifying JWT with issuer validation enabled', ({ Given, When, Then, And }) => {
    Given('a VerifiedTokenService instance that is started', () => {
      service = new VerifiedTokenService(mockOpenIdConfigs);
      service.start();
    });

    And('a valid JWT token', () => {
      // Mock is already set up
    });

    And('issuer validation is enabled for the config', () => {
      // provider1 has ignoreIssuer: false (default)
    });

    When('the JWT is verified with the config key', async () => {
      const result = await service.getVerifiedJwt('valid.jwt.token', 'provider1');
      expect(result).toBeDefined();
    });

    Then('it should verify the token with issuer validation', () => {
      expect(vi.mocked(jwtVerify)).toHaveBeenCalledWith(
        'valid.jwt.token',
        expect.any(Function),
        {
          audience: 'audience1',
          clockTolerance: '5 minutes',
          issuer: 'https://provider1.com', // Issuer should be included when ignoreIssuer is false
        }
      );
    });
  });
});