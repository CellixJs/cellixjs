import {
    createRemoteJWKSet,
    type FlattenedJWSInput,
    type GetKeyFunction,
    type JWSHeaderParameters,
    jwtVerify,
    type JWTVerifyOptions,
    type JWTVerifyResult,
    type ResolvedKey,
} from 'jose';

export type OpenIdConfig = {
  issuerUrl: string;
  oidcEndpoint: string;
  audience: string | string[];
  ignoreIssuer: boolean;
  /**
   * The number of seconds to allow the current time to be off from the token's, 
   * (defalts to 5 minutes if not specified)
   */
  clockTolerance?: string;
  ignoreNbf?: boolean;
}

export class VerifiedTokenService {
  openIdConfigs: Map<string, OpenIdConfig>;
  refreshInterval: number;
  keyStoreCollection: Map<string, { keyStore: GetKeyFunction<JWSHeaderParameters, FlattenedJWSInput>, issuerUrl: string }>;
  timerInstance: NodeJS.Timeout | undefined;

  /**
   * @param openIdConfigs A map of key to OpenIdConfig, when a JWT is verified, the matching key is returned with the verified JWT
   * @param refreshInterval The number of seconds to wait between refreshing the keystore, defaults to 5 minutes
   **/
  constructor(openIdConfigs: Map<string, OpenIdConfig>, refreshInterval: number = 1000 * 60 * 5) {
    if (!openIdConfigs) { throw new Error('openIdConfigs is required'); }
    this.keyStoreCollection = new Map<string, { keyStore: GetKeyFunction<JWSHeaderParameters, FlattenedJWSInput>, issuerUrl: string }>();
    this.openIdConfigs = openIdConfigs;
    this.refreshInterval = refreshInterval;
  }

  /**
   * 
   * Refresh the keystore collection periodically
   * 
   **/
  public start() {
    if (this.timerInstance) {
      return; // already running
    }
    //need to run immediately...
    (() => {
        this.refreshCollection();
    })();
    //..as setInterval only runs after the timer runs out
    this.timerInstance = setInterval(() => {
      (() => {
        this.refreshCollection();
      })();
    }, this.refreshInterval);
  }

  /**
   * For each OIDC Endpoint, either create a new keystore or refresh the existing one.
   * Keys in the keystore expire over time, so it is important to refresh the keystore periodically
   */
  refreshCollection() {
    if (!this.openIdConfigs) { return }
    for (const configKey of [...this.openIdConfigs.keys()]) {
    const openIdConfig = this.openIdConfigs.get(configKey) as OpenIdConfig;
      const newKeyStore = {
        keyStore: createRemoteJWKSet(new URL(openIdConfig.oidcEndpoint)),
        issuerUrl: openIdConfig.issuerUrl
      }
      if (newKeyStore) {
        if (this.keyStoreCollection.has(configKey)) {
          this.keyStoreCollection.delete(configKey); // remove old keystore if it exists
        }
        this.keyStoreCollection.set(configKey, newKeyStore); //Update keystore with new one or add it if it doesn't exist
      }
    }
  }


   /**
   * 
   * Verifies a JWT using the keystore and configuration for the specified key.
   * Returns the decoded and verified JWT payload if the token is valid.
   * 
   * @param bearerToken The JWT string to verify.
   * @param configKey The key identifying which OpenIdConfig and keystore to use.
   * @returns The result of the JWT verification, including the decoded payload and resolved key.
   * @throws Error if the service is not started or the configKey is invalid.
   **/
  public async getVerifiedJwt(bearerToken: string, configKey: string): Promise<JWTVerifyResult & ResolvedKey> {
    if (!this.timerInstance) {
      throw new Error('VerifiedTokenService not started');
    }
    if (!this.keyStoreCollection.has(configKey)) {
      throw new Error('Invalid OpenIdConfig Key');
    }
    const openIdConfig = this.openIdConfigs.get(configKey) as OpenIdConfig;

    const jwtVerifyOptions: JWTVerifyOptions = {
      audience: openIdConfig.audience,
      clockTolerance: openIdConfig.clockTolerance ?? '5 minutes',
    }
    if (openIdConfig.ignoreIssuer !== true) {
      jwtVerifyOptions.issuer = openIdConfig.issuerUrl;
    }

    const keyStoreEntry = this.keyStoreCollection.get(configKey)?.keyStore;
    return await jwtVerify(
      bearerToken,
      keyStoreEntry as GetKeyFunction<JWSHeaderParameters, FlattenedJWSInput>,
      jwtVerifyOptions
    );
  }
}