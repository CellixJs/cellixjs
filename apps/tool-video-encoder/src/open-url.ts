import { spawn } from 'node:child_process';

/**
 * Opens a URL in the default browser. The URL is also printed, so sign-in
 * still works when no browser can be launched (for example over SSH).
 */
export function openInBrowser(url: string, log: (message: string) => void): void {
	log(`If your browser does not open, visit:\n  ${url}`);
	const [command, args] = browserCommand(process.platform, url);
	const child = spawn(command, args, { stdio: 'ignore', detached: true });
	child.on('error', () => undefined);
	child.unref();
}

export function browserCommand(platform: NodeJS.Platform, url: string): [string, string[]] {
	if (platform === 'darwin') {
		return ['open', [url]];
	}
	if (platform === 'win32') {
		// rundll32 takes the URL as a single argument, avoiding cmd.exe parsing of `&` in query strings.
		return ['rundll32', ['url.dll,FileProtocolHandler', url]];
	}
	return ['xdg-open', [url]];
}
