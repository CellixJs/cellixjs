import type { ServiceBase } from '@cellix/api-services-spec';
import { type OpenIdConfig, VerifiedTokenService } from './verified-token-service.js';

export interface TokenValidation {
	verifyJwt<ClaimsType>(token: string): Promise<TokenValidationResult<ClaimsType> | null>;
}

export interface TokenValidationResult<ClaimsType> {
    verifiedJwt: ClaimsType
    openIdConfigKey: string;
}

export class ServiceTokenValidation implements ServiceBase<TokenValidation> {
	private readonly tokenVerifier: VerifiedTokenService;
	private readonly tokenSettings: Map<string, OpenIdConfig>;
	private readonly refreshInterval: number;

	constructor(portalTokens: Map<string, string>, refreshInterval: number = 1000 * 60 * 5) {
		this.tokenSettings = new Map<string, OpenIdConfig>();
		this.refreshInterval = refreshInterval;

		for (const [portalKey, envPrefix] of portalTokens) {
			this.tokenSettings.set(
				portalKey,
				{
					oidcEndpoint: this.tryGetConfigValue(`${envPrefix}_OIDC_ENDPOINT`),
					clockTolerance: this.tryGetConfigValueWithDefault(`${envPrefix}_OIDC_CLOCK_TOLERANCE`, '5 minutes'),
					audience: this.tryGetConfigValue(`${envPrefix}_OIDC_AUDIENCE`),
					issuerUrl: this.tryGetConfigValue(`${envPrefix}_OIDC_ISSUER`),
					ignoreIssuer: this.tryGetConfigValueWithDefault(`${envPrefix}_OIDC_IGNORE_ISSUER`, 'false') === 'true',
				} as OpenIdConfig
			);
		}
		this.tokenVerifier = new VerifiedTokenService(this.tokenSettings, this.refreshInterval);
	}

	startUp(): Promise<TokenValidation> {
		this.tokenVerifier.start();
		return Promise.resolve(this);
	}

	async verifyJwt<ClaimsType>(token: string): Promise<TokenValidationResult<ClaimsType> | null> {
		// Try each config key for verification
		for (const configKey of this.tokenSettings.keys()) {
			const result = await this.tokenVerifier.getVerifiedJwt(token, configKey);
			if (result?.payload) {
				return {
                    verifiedJwt: result.payload as ClaimsType,
                    openIdConfigKey: configKey,
                }
			}
		}
		return null;
	}

	shutDown(): Promise<void> {
		// Optionally clear interval or cleanup if needed
		if (this.tokenVerifier.timerInstance) {
			clearInterval(this.tokenVerifier.timerInstance);
		}
        console.log('ServiceTokenValidation stopped');
        return Promise.resolve();
	}

	private tryGetConfigValue(configKey: string) {
		if (Object.hasOwn(process.env, configKey)) {
			return process.env[configKey];
		} else {
			throw new Error(`Environment variable ${configKey} not set`);
		}
	}

	private tryGetConfigValueWithDefault(configKey: string, defaultValue: string) {
		if (Object.hasOwn(process.env, configKey)) {
			return process.env[configKey];
		} else {
			return defaultValue;
		}
	}
}