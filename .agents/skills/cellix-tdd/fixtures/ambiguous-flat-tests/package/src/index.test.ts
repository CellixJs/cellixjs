import { expect, it } from 'vitest';

import { parseHost, parsePort } from './index.ts';

it('defaults the host to localhost', () => {
	expect(parseHost(undefined)).toBe('localhost');
});

it('parses a valid TCP port', () => {
	expect(parsePort('8080')).toBe(8080);
});
