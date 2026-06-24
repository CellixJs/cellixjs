import { Ability, type Discardable, Interaction } from '@serenity-js/core';
import { type RenderResult, render } from '@testing-library/react';
import type { ReactElement } from 'react';

/** Wraps a rendered React element before it is mounted (providers, routing, theme). */
export type ReactRenderWrapper = (children: ReactElement) => ReactElement;

/** Options accepted when rendering a component through {@link RenderInDom}. */
export interface RenderComponentOptions {
	/** Optional wrapper supplying providers such as routing, theme, or GraphQL. */
	wrapper?: ReactRenderWrapper;
}

/**
 * Serenity ability that renders React components into the active in-process DOM
 * and owns the resulting container for the lifetime of a scenario.
 *
 * This is the in-process DOM counterpart to a browser `BrowseTheWeb` ability:
 * page objects obtain their root element from the actor's ability rather than
 * receiving a container through world state or task parameters, so component
 * acceptance tests and browser E2E tests share the same actor-centric shape.
 *
 * The ability is {@link Discardable}; Serenity unmounts the rendered tree when
 * the actor is dismissed. Suites that do not rely on Serenity actor dismissal
 * can also call {@link unmount} from a test-runner teardown hook.
 *
 * @example
 * ```ts
 * const cast = new SerenityCast({ useNotepad: true, abilities: [() => new RenderInDom()] });
 *
 * // in a step:
 * await actor.attemptsTo(Render.component(<LoginForm />, { wrapper: withProviders() }));
 * const page = new LoginPage(new DomPageAdapter(RenderInDom.as(actor).container));
 * ```
 */
export class RenderInDom extends Ability implements Discardable {
	private rendered: RenderResult | undefined;

	/**
	 * Create a render ability with no component mounted yet.
	 *
	 * Declared explicitly to widen Serenity's `protected` ability constructor to
	 * `public`, so the cast can instantiate it and `RenderInDom.as(actor)` resolves.
	 */
	// biome-ignore lint/complexity/noUselessConstructor: widens the inherited protected constructor to public.
	constructor() {
		super();
	}

	/**
	 * Render a React element, unmounting any element previously rendered by this
	 * ability so scenarios do not leak DOM state.
	 *
	 * @param ui React element to render.
	 * @param options Optional provider wrapper.
	 * @returns Testing Library render result for the mounted component.
	 */
	render(ui: ReactElement, options?: RenderComponentOptions): RenderResult {
		this.unmount();
		this.rendered = render(options?.wrapper ? options.wrapper(ui) : ui);
		return this.rendered;
	}

	/**
	 * Root element that scopes all page-object selections for the current render.
	 *
	 * @throws Error when no component has been rendered yet.
	 */
	get container(): HTMLElement {
		return this.currentResult().container;
	}

	/**
	 * Testing Library render result for the current render.
	 *
	 * @throws Error when no component has been rendered yet.
	 */
	get result(): RenderResult {
		return this.currentResult();
	}

	/** Unmount the current render, if one exists. */
	unmount(): void {
		this.rendered?.unmount();
		this.rendered = undefined;
	}

	/** Unmount on actor dismissal. Invoked by Serenity when the scene finishes. */
	discard(): void {
		this.unmount();
	}

	private currentResult(): RenderResult {
		if (!this.rendered) {
			throw new Error('RenderInDom: no component has been rendered — did the Given step run?');
		}
		return this.rendered;
	}
}

/**
 * Screenplay interactions for rendering components through {@link RenderInDom}.
 */
export const Render = {
	/**
	 * Render a React component into the active DOM via the actor's
	 * {@link RenderInDom} ability.
	 *
	 * @param ui React element to render.
	 * @param options Optional provider wrapper.
	 */
	component: (ui: ReactElement, options?: RenderComponentOptions): Interaction =>
		Interaction.where('#actor renders a component', (actor) => {
			RenderInDom.as(actor).render(ui, options);
		}),
} as const;
