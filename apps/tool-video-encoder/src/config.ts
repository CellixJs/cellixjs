import { homedir } from 'node:os';
import { join } from 'node:path';

export interface EncoderConfig {
	auth: {
		issuer: string;
		clientId: string;
		scope: string;
	};
	apiUrl: string;
	/** Where the signed-in session is kept between runs. */
	sessionFile: string;
	tools: {
		ffmpegPath?: string;
		ffprobePath?: string;
		packagerPath?: string;
		workingDirectory?: string;
	};
}

/**
 * Reads encoder configuration from environment variables.
 *
 * | Variable | Default | Meaning |
 * |---|---|---|
 * | `OCOM_ENCODER_ISSUER` | required | Staff OIDC issuer (Entra ID tenant, or the local mock) |
 * | `OCOM_ENCODER_CLIENT_ID` | required | Staff portal app registration client ID |
 * | `OCOM_ENCODER_SCOPE` | `openid profile offline_access` | Scopes; include the API scope the staff portal uses |
 * | `OCOM_ENCODER_API_URL` | required | GraphQL endpoint |
 * | `OCOM_ENCODER_SESSION_FILE` | `~/.ocom-video-encoder/session.json` | Saved sign-in |
 * | `FFMPEG_PATH`, `FFPROBE_PATH`, `PACKAGER_PATH` | on `PATH` | Encoder executables |
 * | `ENCODING_WORKING_DIRECTORY` | OS temp dir | Scratch space while encoding |
 *
 * @throws {Error} Naming every required variable that is missing.
 */
export function readEncoderConfig(env: NodeJS.ProcessEnv = process.env): EncoderConfig {
	const value = (name: string) => env[name]?.trim() || undefined;
	const required = ['OCOM_ENCODER_ISSUER', 'OCOM_ENCODER_CLIENT_ID', 'OCOM_ENCODER_API_URL'];
	const missing = required.filter((name) => !value(name));
	if (missing.length > 0) {
		throw new Error(`Missing configuration: ${missing.join(', ')}`);
	}

	const tools = {
		ffmpegPath: value('FFMPEG_PATH'),
		ffprobePath: value('FFPROBE_PATH'),
		packagerPath: value('PACKAGER_PATH'),
		workingDirectory: value('ENCODING_WORKING_DIRECTORY'),
	};
	return {
		auth: {
			issuer: value('OCOM_ENCODER_ISSUER') as string,
			clientId: value('OCOM_ENCODER_CLIENT_ID') as string,
			scope: value('OCOM_ENCODER_SCOPE') ?? 'openid profile offline_access',
		},
		apiUrl: value('OCOM_ENCODER_API_URL') as string,
		sessionFile: value('OCOM_ENCODER_SESSION_FILE') ?? join(homedir(), '.ocom-video-encoder', 'session.json'),
		tools: Object.fromEntries(Object.entries(tools).filter(([, setting]) => setting !== undefined)),
	};
}
