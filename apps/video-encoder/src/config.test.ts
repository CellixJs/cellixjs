import { homedir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readEncoderConfig } from './config.ts';

describe('readEncoderConfig', () => {
	const base = { OCOM_ENCODER_ISSUER: 'https://login.example/tenant/v2.0', OCOM_ENCODER_CLIENT_ID: 'staff-client', OCOM_ENCODER_API_URL: 'https://api.example/api/graphql' };

	it('applies defaults for scope, session file, and tools', () => {
		expect(readEncoderConfig(base)).toEqual({
			auth: { issuer: 'https://login.example/tenant/v2.0', clientId: 'staff-client', scope: 'openid profile offline_access' },
			apiUrl: 'https://api.example/api/graphql',
			sessionFile: join(homedir(), '.ocom-video-encoder', 'session.json'),
			tools: {},
		});
	});

	it('reads every override', () => {
		const config = readEncoderConfig({
			...base,
			OCOM_ENCODER_SCOPE: 'openid api://staff/user_impersonation',
			OCOM_ENCODER_SESSION_FILE: '/tmp/session.json',
			FFMPEG_PATH: '/opt/ffmpeg',
			FFPROBE_PATH: '/opt/ffprobe',
			PACKAGER_PATH: '/opt/packager',
			ENCODING_WORKING_DIRECTORY: '/scratch',
		});

		expect(config.auth.scope).toBe('openid api://staff/user_impersonation');
		expect(config.sessionFile).toBe('/tmp/session.json');
		expect(config.tools).toEqual({ ffmpegPath: '/opt/ffmpeg', ffprobePath: '/opt/ffprobe', packagerPath: '/opt/packager', workingDirectory: '/scratch' });
	});

	it('names every missing required variable, treating blanks as missing', () => {
		expect(() => readEncoderConfig({ OCOM_ENCODER_CLIENT_ID: '  ' })).toThrow('Missing configuration: OCOM_ENCODER_ISSUER, OCOM_ENCODER_CLIENT_ID, OCOM_ENCODER_API_URL');
	});
});
