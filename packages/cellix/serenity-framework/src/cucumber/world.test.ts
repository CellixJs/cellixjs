import type { Cast } from '@serenity-js/core';
import { describe, expect, it, vi } from 'vitest';
import { ManagedSerenityWorld } from './world.ts';

describe('ManagedSerenityWorld', () => {
	it('starts infrastructure, validates state, creates the cast, and resets during cleanup', async () => {
		const state = { apiUrl: 'https://api.test/graphql' };
		const infrastructure = {
			ensureStarted: vi.fn(),
			getState: vi.fn(() => state),
			resetScenarioState: vi.fn(),
		};
		const validateState = vi.fn();
		const createCast = vi.fn(() => ({ prepare: vi.fn() }) as unknown as Cast);
		const world = new ManagedSerenityWorld({ attach: vi.fn(), log: vi.fn(), link: vi.fn(), parameters: {} }, { createCast, infrastructure, validateState });

		await world.init();
		await world.cleanup();

		expect(infrastructure.ensureStarted).toHaveBeenCalledOnce();
		expect(validateState).toHaveBeenCalledWith(state);
		expect(createCast).toHaveBeenCalledWith(state);
		expect(infrastructure.resetScenarioState).toHaveBeenCalledOnce();
	});
});
