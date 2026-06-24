import { describe, expect, it } from 'vitest';
import { VerificationTimeouts } from './index.ts';

describe('VerificationTimeouts', () => {
	it('uses positive integer environment overrides', () => {
		const timeouts = new VerificationTimeouts({
			defaults: { serverStartup: 100 },
			env: { TIMEOUT_SERVER_STARTUP: '250' },
		});

		expect(timeouts.get('serverStartup')).toBe(250);
	});

	it('falls back to defaults for invalid overrides', () => {
		const timeouts = new VerificationTimeouts({
			defaults: { serverStartup: 100 },
			env: { TIMEOUT_SERVER_STARTUP: 'nope' },
		});

		expect(timeouts.get('serverStartup')).toBe(100);
	});
});
