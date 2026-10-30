/// <reference types="node" />
import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { buildOcomUrls } from '@ocom/local-dev-config';

// Point the encoder at this worktree's local API and mock staff sign-in.
const urls = buildOcomUrls();

const child = spawn(process.execPath, ['src/index.ts', ...process.argv.slice(2)], {
	stdio: 'inherit',
	env: {
		...process.env,
		OCOM_ENCODER_ISSUER: urls.mockStaffAuthorityUrl,
		OCOM_ENCODER_CLIENT_ID: 'mock-client',
		OCOM_ENCODER_SCOPE: 'openid',
		OCOM_ENCODER_API_URL: urls.apiGraphqlUrl,
		OCOM_ENCODER_SESSION_FILE: path.join(os.homedir(), '.ocom-video-encoder', 'session.local.json'),
		NODE_EXTRA_CA_CERTS: process.env['PORTLESS_CA_PATH'] ?? path.join(os.homedir(), '.portless', 'ca.pem'),
	},
});
// Ctrl+C reaches the child directly; wait for it to stop cleanly.
process.on('SIGINT', () => undefined);
child.on('exit', (code) => {
	process.exitCode = code ?? 1;
});
