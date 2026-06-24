/** Options used when resolving actor references from Gherkin text. */
export interface ActorNameResolutionOptions {
	/** Name used when a pronoun is supplied. Defaults to `Alice`. */
	defaultName?: string;
}

const pronounPattern = /^(she|he|they)$/i;

/**
 * Resolver object for actor names found in Gherkin steps.
 */
export const ActorName = {
	/**
	 * Resolve pronouns such as `she`, `he`, or `they` to a default actor name.
	 *
	 * @param actorName Name or pronoun captured from a Gherkin step.
	 * @param options Optional default name configuration.
	 */
	resolve(actorName: string, options: ActorNameResolutionOptions = {}): string {
		return pronounPattern.test(actorName) ? (options.defaultName ?? 'Alice') : actorName;
	},
} as const;
