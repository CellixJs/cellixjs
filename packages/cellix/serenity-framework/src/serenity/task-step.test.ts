import type { PerformsActivities } from '@serenity-js/core';
import { describe, expect, it } from 'vitest';
import { TaskStep } from './index.ts';

describe('TaskStep', () => {
	it('executes the supplied action with the actor', async () => {
		const actor = { name: 'Alice' } as unknown as PerformsActivities & { name: string };
		let observedActor: typeof actor | undefined;

		await new TaskStep<typeof actor>('#actor does something useful', (currentActor) => {
			observedActor = currentActor;
		}).performAs(actor);

		expect(observedActor).toBe(actor);
	});
});
