import { parseArgs } from 'node:util';
import type { EncoderApiClient, VideoAwaitingEncoding, VideoEncodingProgress } from '@ocom/video-encoder-client';
import type { Auth } from './auth.ts';

interface CliDependencies {
	api: Pick<EncoderApiClient, 'ensureStaffUser' | 'listAwaitingEncoding'>;
	auth: Pick<Auth, 'login' | 'logout'>;
	encode: (videoId: string, options: { signal: AbortSignal; onProgress: (progress: VideoEncodingProgress) => void }) => Promise<unknown>;
	/** Results and tables. */
	out: (line: string) => void;
	/** Progress and errors. */
	err: (line: string) => void;
	/** Aborted on Ctrl+C: the running encode stops and the video is left to encode again. */
	signal: AbortSignal;
}

export const Usage = `Usage: video-encoder <command>

Commands:
  login              Sign in through your browser
  logout             Forget the saved sign-in
  list               List uploaded videos waiting to be encoded
  encode <id>...     Encode the given videos
  encode --all       Encode every video waiting to be encoded
  help               Show this help`;

/**
 * Runs one command.
 *
 * @returns The process exit code: 0 on success, 1 when a command or any encode failed, 2 on bad usage.
 */
export async function runCli(argv: string[], deps: CliDependencies): Promise<number> {
	const { values, positionals } = parseArgs({ args: argv, allowPositionals: true, strict: false, options: { all: { type: 'boolean' }, help: { type: 'boolean', short: 'h' } } });
	const [command, ...ids] = positionals;

	try {
		if (values.help || command === undefined || command === 'help') {
			deps.out(Usage);
			return 0;
		}
		switch (command) {
			case 'login': {
				await deps.auth.login();
				const staff = await deps.api.ensureStaffUser();
				deps.out(`Signed in as ${staff.displayName}.`);
				return 0;
			}
			case 'logout':
				await deps.auth.logout();
				deps.out('Signed out.');
				return 0;
			case 'list':
				await deps.api.ensureStaffUser();
				printVideos(await deps.api.listAwaitingEncoding(), deps.out);
				return 0;
			case 'encode':
				return await encode(values.all === true, ids, deps);
			default:
				deps.err(`Unknown command: ${command}\n\n${Usage}`);
				return 2;
		}
	} catch (error) {
		deps.err(`Error: ${(error as Error).message}`);
		return 1;
	}
}

async function encode(all: boolean, ids: string[], deps: CliDependencies): Promise<number> {
	if (all === ids.length > 0) {
		deps.err(`Give video IDs or --all, not both.\n\n${Usage}`);
		return 2;
	}
	await deps.api.ensureStaffUser();
	const videoIds = all ? (await deps.api.listAwaitingEncoding()).filter((video) => video.status !== 'ENCODING').map((video) => video.id) : ids;
	if (videoIds.length === 0) {
		deps.out('No videos are waiting to be encoded.');
		return 0;
	}

	let failed = 0;
	for (const [index, videoId] of videoIds.entries()) {
		if (deps.signal.aborted) {
			break;
		}
		deps.err(`[${index + 1}/${videoIds.length}] Encoding ${videoId}`);
		let lastReported = '';
		try {
			await deps.encode(videoId, {
				signal: deps.signal,
				onProgress: ({ stage, percent }) => {
					// Report each stage start and every 10%, so logs stay readable.
					const report = `${stage} ${Math.floor(percent / 10) * 10}%`;
					if (report !== lastReported) {
						lastReported = report;
						deps.err(`  ${report}`);
					}
				},
			});
			deps.out(`${videoId}: ready`);
		} catch (error) {
			failed++;
			deps.out(`${videoId}: failed - ${(error as Error).message}`);
		}
	}
	if (deps.signal.aborted) {
		deps.err('Stopped. Videos that were not finished can be encoded again.');
		return 1;
	}
	return failed > 0 ? 1 : 0;
}

function printVideos(videos: VideoAwaitingEncoding[], out: (line: string) => void): void {
	if (videos.length === 0) {
		out('No videos are waiting to be encoded.');
		return;
	}
	const rows = videos.map((video) => [video.id, video.status, video.communityName ?? video.communityId, `${(video.sourceSizeBytes / 1024 / 1024).toFixed(1)} MB`, video.createdAt.slice(0, 10), video.title]);
	const header = ['ID', 'STATUS', 'COMMUNITY', 'SIZE', 'UPLOADED', 'TITLE'];
	const widths = header.map((title, column) => Math.max(title.length, ...rows.map((row) => (row[column] ?? '').length)));
	const format = (row: string[]) =>
		row
			.map((cell, column) => (column === row.length - 1 ? cell : cell.padEnd(widths[column] ?? 0)))
			.join('  ')
			.trimEnd();
	out(format(header));
	for (const [index, row] of rows.entries()) {
		out(format(row));
		const failure = videos[index]?.failureMessage;
		if (failure) {
			out(`  last failure: ${failure}`);
		}
	}
}
