// Use jose to generate and manage the signing key
import crypto from 'node:crypto';
import express from 'express';
import { exportJWK, generateKeyPair, type KeyLike, SignJWT } from 'jose';
import { setupEnvironment } from './setup-environment.ts';

setupEnvironment();

const app = express();
app.disable('x-powered-by');
const port = 4000;
// biome-ignore lint:useLiteralKeys
const allowedRedirectUri = process.env['ALLOWED_REDIRECT_URI'] || 'http://localhost:3000/auth-redirect';
const aud = allowedRedirectUri;
// Type for user profile used in token claims
interface TokenProfile {
  aud: string;
  sub: string;
  iss: string;
  email: string;
  given_name: string;
  family_name: string;
  tid: string;
}

// Helper to generate a token response using jose-managed key
// Note: privateKey and jwk are always jose objects, safe for dev/test. Linter warning for 'any' can be ignored in this context.
async function buildTokenResponse(
  profile: TokenProfile,
  privateKey: KeyLike | Uint8Array,
  jwk: { alg?: string; kid?: string },
  existingRefreshToken?: string,
) {
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = 3600;
  const exp = now + expiresIn;

  // Manually sign the id_token as a JWT with all claims using jose
  const idTokenPayload = {
    iss: `http://localhost:${port}`,
    sub: profile.sub,
    aud: profile.aud,
    email: profile.email,
    given_name: profile.given_name,
    family_name: profile.family_name,
    tid: profile.tid,
    exp,
    iat: now,
    typ: 'id_token',
  };
  const alg = jwk.alg || 'RS256';
  const id_token = await new SignJWT(idTokenPayload)
    .setProtectedHeader({ alg, kid: jwk.kid || '', typ: 'JWT' })
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .sign(privateKey);

  // Manually sign the access_token as a JWT with all claims using jose
  const accessTokenPayload = {
    iss: `http://localhost:${port}`,
    sub: profile.sub,
    aud: profile.aud,
    email: profile.email,
    given_name: profile.given_name,
    family_name: profile.family_name,
    tid: profile.tid,
    exp,
    iat: now,
    typ: 'access_token',
  };
  const access_token = await new SignJWT(accessTokenPayload)
    .setProtectedHeader({ alg, kid: jwk.kid || '', typ: 'JWT' })
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .sign(privateKey);

  // Use existing refresh_token if provided (for refresh flow), otherwise generate new
  const refresh_token = existingRefreshToken || crypto.randomUUID();
  return {
    id_token,
    session_state: null,
    access_token,
    refresh_token,
    token_type: 'Bearer',
    scope: 'openid',
    profile: {
      exp,
      ver: '1.0',
      iss: `http://localhost:${port}`,
      sub: profile.sub,
      aud: profile.aud,
      iat: now,
      email: profile.email,
      given_name: profile.given_name,
      family_name: profile.family_name,
      tid: profile.tid,
    },
    expires_at: exp,
  };
}

// Main async startup
async function main() {
  // Generate signing keypair with jose
  const { publicKey, privateKey } = await generateKeyPair('RS256');
  const publicJwk = await exportJWK(publicKey);
  publicJwk.use = 'sig';
  publicJwk.alg = 'RS256';
  publicJwk.kid = publicJwk.kid || 'mock-key';

  // Serve JWKS endpoint from Express
  app.get('/.well-known/jwks.json', (_req, res) => {
    res.json({ keys: [publicJwk] });
  });

  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  // Support form-data (multipart/form-data) parsing
  app.use((req, res, next) => {
    const { origin } = req.headers;

    if (origin && isLocalOrigin(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');

    // Echo requested headers for robust preflight; fallback as needed
    const reqHeaders = req.headers['access-control-request-headers'] || 'Content-Type,Authorization';
    res.setHeader('Access-Control-Allow-Headers', reqHeaders);

    if (req.method === 'OPTIONS') {
      // If origin is non-local, block the preflight; browser will enforce CORS
      if (origin && !isLocalOrigin(origin)) {
        res.sendStatus(403);
        return;
      }
      res.sendStatus(204);
      return;
    }
    next();
  });

  // Token endpoint
  app.post('/token', async (req, res) => {
  // biome-ignore lint:useLiteralKeys
  const email = process.env['Email'];
  if (!email) { throw new Error('Email is not defined in .env.local'); }
  // biome-ignore lint:useLiteralKeys
  const given_name = process.env['Given_Name'];
  if (!given_name) { throw new Error('Given_Name is not defined in .env.local'); }
  // biome-ignore lint:useLiteralKeys
  const family_name = process.env['Family_Name'];
  if (!family_name) { throw new Error('Family_Name is not defined in .env.local'); }
  // biome-ignore lint:useLiteralKeys
  const sub = process.env['Sub'] ?? crypto.randomUUID();
    const { tid, refresh_token } = req.body as { tid?: string; refresh_token?: string };

    const profile: TokenProfile = {
      aud: aud,
      sub: sub,
      iss: `http://localhost:${port}`,
      email,
      given_name,
      family_name,
      tid: tid || 'test-tenant-id',
    };
    const tokenResponse = await buildTokenResponse(
      profile,
      privateKey,
      publicJwk,
      refresh_token,
    );
    res.json(tokenResponse);
  });

  app.get('/.well-known/openid-configuration', (_req, res) => {
    res.json({
      issuer: 'http://localhost:4000',
      authorization_endpoint: 'http://localhost:4000/authorize',
      token_endpoint: 'http://localhost:4000/token',
      userinfo_endpoint: 'http://localhost:4000/userinfo',
      jwks_uri: 'http://localhost:4000/.well-known/jwks.json',
      response_types_supported: ['code', 'token'],
      subject_types_supported: ['public'],
      id_token_signing_alg_values_supported: ['RS256'],
      scopes_supported: ['openid', 'profile', 'email'],
      token_endpoint_auth_methods_supported: ['client_secret_post'],
      claims_supported: ['sub', 'email', 'name'],
    });
  });

  app.get('/authorize', (req, res) => {
    const { state } = req.query as { state?: string };

    // Always use the trusted, server-configured redirect URI
    const code = crypto.randomUUID();

    const redirectUrl = new URL(allowedRedirectUri);
    redirectUrl.searchParams.set('code', code);

    // Include state if present, but encode and keep it bounded
    if (typeof state === 'string' && state.length <= 2048) {
      redirectUrl.searchParams.set('state', state);
    }

    res.redirect(redirectUrl.toString());
  });

  app.listen(port, '127.0.0.1', () => {
    // eslint-disable-next-line no-console
    console.log(`Mock OAuth2 server running on http://localhost:${port}`);
    console.log(
      `JWKS endpoint running on http://localhost:${port}/.well-known/jwks.json`,
    );
  });
}

  // CORS: only allow localhost/127.0.0.1 on any port
  const isLocalOrigin = (origin?: string) => {
    if (!origin) { return false; }
    // Allow http(s)://localhost, http(s)://127.0.0.1, and subdomains of localhost
    return /^https?:\/\/(([\w-]+\.)*localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
  };

main();
