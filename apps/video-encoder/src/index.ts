import { createEncoderApiClient, encodeVideo, refreshSignIn, signInWithBrowser } from '@ocom/video-encoder-client';
import { createAuth } from './auth.ts';
import { runCli, Usage } from './cli.ts';
import { readEncoderConfig } from './config.ts';
import { openInBrowser } from './open-url.ts';
import { createFileSessionStore } from './session.ts';

const err = (line: string) => process.stderr.write(`${line}\n`);
const out = (line: string) => process.stdout.write(`${line}\n`);

const controller = new AbortController();
process.once('SIGINT', () => {
	err('\nStopping...');
	controller.abort();
});

const argv = process.argv.slice(2);

try {
	if (argv.length === 0 || ['help', '--help', '-h'].includes(argv[0] ?? '')) {
		// Help needs no configuration.
		out(Usage);
		process.exit(0);
	}
	const config = readEncoderConfig();
	const auth = createAuth({
		config: config.auth,
		store: createFileSessionStore(config.sessionFile),
		signIn: signInWithBrowser,
		refresh: refreshSignIn,
		openUrl: (url) => openInBrowser(url, err),
		log: err,
	});
	const api = createEncoderApiClient({ apiUrl: config.apiUrl, getAccessToken: () => auth.getAccessToken() });
	process.exitCode = await runCli(argv, {
		api,
		auth,
		encode: (videoId, options) => encodeVideo({ api, videoId, tools: config.tools, ...options }),
		out,
		err,
		signal: controller.signal,
	});
} catch (error) {
	err(`Error: ${(error as Error).message}`);
	process.exitCode = 1;
}
