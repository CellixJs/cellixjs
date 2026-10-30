import { describe, expect, it } from 'vitest';
import { browserCommand } from './open-url.ts';

describe('browserCommand', () => {
	const url = 'https://login.example/authorize?a=1&b=2';

	it.each([
		['darwin', ['open', [url]]],
		['win32', ['rundll32', ['url.dll,FileProtocolHandler', url]]],
		['linux', ['xdg-open', [url]]],
	] as const)('passes the URL as a single argument on %s', (platform, expected) => {
		expect(browserCommand(platform, url)).toEqual(expected);
	});
});
