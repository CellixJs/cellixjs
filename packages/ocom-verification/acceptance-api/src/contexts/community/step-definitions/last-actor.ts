import { actors } from '@ocom-verification/verification-shared/test-data';

/**
 * Tracks the most recent actor a community step acted as, so follow-up
 * `Then` steps that omit the actor name resolve to the correct actor across
 * the community step-definition files.
 */
let lastActorName = actors.CommunityOwner.name;

export function setLastActorName(actorName: string): void {
	lastActorName = actorName;
}

export function getLastActorName(): string {
	return lastActorName;
}
