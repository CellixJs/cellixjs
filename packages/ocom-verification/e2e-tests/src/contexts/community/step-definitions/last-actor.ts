import { actors } from '@ocom-verification/verification-shared/test-data';

/**
 * Tracks the most recent actor across the community step-definition files so
 * that then-steps without an explicit actor name (for example
 * "the community name should be ...") resolve the right actor regardless of
 * which feature file the preceding when-step came from.
 */
let lastActorName = actors.CommunityOwner.name;

export const setLastActorName = (actorName: string): void => {
	lastActorName = actorName;
};

export const getLastActorName = (): string => lastActorName;
