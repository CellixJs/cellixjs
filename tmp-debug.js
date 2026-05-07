import express from 'express';
import fetch from 'node-fetch';
import { createServer } from 'http';
import { buildOidcRouter } from './packages/cellix/server-oauth2-mock-seedwork/dist/router.js';

async function run() {
  const app = express();
  const store = {
    users: [],
    listUsers() { return Promise.resolve(this.users); },
    findByUsername(username) { return Promise.resolve(this.users.find(u => u.username === username)); },
    findBySub(sub) { return Promise.resolve(this.users.find(u => u.sub === sub)); },
    addUser(user) { this.users.push(user); return Promise.resolve(); }
  };
  const redirect = 'http://127.0.0.1:0/cb';
  const config = {
    allowedRedirectUris: new Set([redirect]),
    allowedRedirectUri: redirect,
    redirectUriToAudience: new Map([[redirect, 'test-aud']]),
    getUserProfile: () => ({ email: 'portal@example.com' }),
    userStore: store
  };
  const router = await buildOidcRouter('http://127.0.0.1:0', config);
  app.use(router);
  const srv = app.listen(0);
  await new Promise(r => srv.on('listening', r));
  const port = srv.address().port;
  const base = `http://127.0.0.1:${port}`;
  const signupUrl = `${base}/signup`;
  const body = new URLSearchParams({ username: 'carol', password: 'secret', email: 'carol@example.com', given_name: 'Carol', family_name: 'Jones', redirect_uri: redirect.replace('0', port) });
  const res = await fetch(signupUrl, { method: 'POST', body: body.toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, redirect: 'manual' });
  console.log('signup status', res.status);
  const loc = res.headers.get('location');
  console.log('location', loc);
  const u = new URL(loc);
  const code = u.searchParams.get('code');
  const tokenRes = await fetch(`${base}/token`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ grant_type: 'authorization_code', code }) });
  const tokenJson = await tokenRes.json();
  console.log('tokenJson', tokenJson);
  function decodeJwtPayload(token) {
    const parts = token.split('.');
    const buf = Buffer.from(parts[1], 'base64url');
    return JSON.parse(buf.toString('utf8'));
  }
  const idPayload = decodeJwtPayload(tokenJson.id_token);
  console.log('idPayload', idPayload);
  const accessPayload = decodeJwtPayload(tokenJson.access_token);
  console.log('accessPayload', accessPayload);
  const infoRes = await fetch(`${base}/userinfo`, { headers: { Authorization: `Bearer ${tokenJson.access_token}` } });
  console.log('userinfo status', infoRes.status);
  const info = await infoRes.json();
  console.log('userinfo', info);
  srv.close();
}

run().catch(err => { console.error(err); process.exit(1); });
