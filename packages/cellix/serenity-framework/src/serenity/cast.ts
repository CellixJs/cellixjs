import { type Ability, type Actor, Cast, Notepad, TakeNotes } from '@serenity-js/core';

/** Factory that creates a Serenity ability for an actor. */
export type SerenityAbilityFactory = (actor: Actor) => Ability;

/** Options used by {@link SerenityCast}. */
export interface SerenityCastOptions {
	/** Ability factories added to every prepared actor. */
	abilities?: SerenityAbilityFactory[];

	/** Whether each actor receives a Serenity notepad. */
	useNotepad: boolean;
}

/**
 * Generic Serenity cast for Cellix verification suites.
 *
 * Consumers provide the ability factories their suite needs. The framework
 * supplies a single cast implementation so suites do not need local cast
 * subclasses for common GraphQL, browser, or notepad-only actor setup.
 */
export class SerenityCast extends Cast {
	private readonly abilities: SerenityAbilityFactory[];
	private readonly useNotepad: boolean;

	/**
	 * @param options Ability factories and notepad behavior.
	 */
	constructor(options: SerenityCastOptions) {
		super();
		this.abilities = options.abilities ?? [];
		this.useNotepad = options.useNotepad;
	}

	/**
	 * Prepare an actor with the configured abilities.
	 *
	 * @param actor Actor created by Serenity/JS.
	 */
	prepare(actor: Actor): Actor {
		const abilities = this.abilities.map((factory) => factory(actor));
		return this.useNotepad ? actor.whoCan(TakeNotes.using(Notepad.empty()), ...abilities) : actor.whoCan(...abilities);
	}
}
