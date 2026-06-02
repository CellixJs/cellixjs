import { Ability, type Actor } from '@serenity-js/core';

/** Community details accepted by OCOM verification flows. */
export interface CreateCommunityDetails {
	/** Community display name. */
	name: string;
}

/** Result returned by a concrete community creation flow. */
export interface CreateCommunityResult {
	/** Created community id, when the flow exposes one. */
	id?: string;

	/** Created community name. */
	name: string;
}

/** Handler that performs community creation for an actor. */
export type CreateCommunityHandler = (actor: Actor, details: CreateCommunityDetails) => Promise<CreateCommunityResult>;

/**
 * Serenity ability that lets an actor create OCOM communities.
 *
 * The ability centralizes the domain capability while allowing each verification
 * package to provide the environment-specific implementation.
 */
export class CreateCommunity extends Ability {
	/**
	 * @param handler Function that performs community creation.
	 */
	constructor(private readonly handler: CreateCommunityHandler) {
		super();
	}

	/**
	 * Create the ability from an environment-specific community creation handler.
	 *
	 * @param handler Function that performs community creation.
	 */
	static using(handler: CreateCommunityHandler): CreateCommunity {
		return new CreateCommunity(handler);
	}

	/**
	 * Create a community through the configured verification environment.
	 *
	 * @param actor Actor creating the community.
	 * @param details Community details.
	 */
	async performAs(actor: Actor, details: CreateCommunityDetails): Promise<CreateCommunityResult> {
		return await this.handler(actor, details);
	}
}
