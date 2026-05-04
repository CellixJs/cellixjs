export interface ActorDetails {
	name: string;
	externalId: string;
	email: string;
	givenName: string;
	familyName: string;
}

// Resolve Gherkin pronoun references to actor names
export function resolveActorName(actorName: string, defaultName = 'Alice'): string {
	return /^(she|he|they)$/i.test(actorName) ? defaultName : actorName;
}
