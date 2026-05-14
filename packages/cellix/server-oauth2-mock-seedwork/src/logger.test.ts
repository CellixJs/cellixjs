import { describe, expect, it } from 'vitest';
import { debugLog } from './index.ts';

describe('debugLog', () => {
	it('returns undefined when debug logging is disabled', () => {
		expect(debugLog('test message')).toBeUndefined();
	});
});
