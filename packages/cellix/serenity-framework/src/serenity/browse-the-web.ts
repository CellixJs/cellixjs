import { Ability, type Actor, type UsesAbilities } from '@serenity-js/core';
import type { BrowserContext, Page } from 'playwright';

const actorBrowserMap = new Map<string, BrowseTheWeb>();
let fallbackInstance: BrowseTheWeb | undefined;

/**
 * Serenity ability that exposes a Playwright page and browser context.
 *
 * The ability supports a current fallback page for single-browser test suites
 * and optional actor registration for multi-actor scenarios. Calling
 * {@link BrowseTheWeb.using} replaces the fallback instance. Closing an ability
 * detaches it from the fallback and actor registries; suites that create
 * browser abilities directly should close them during teardown to avoid leaking
 * actor registrations across scenarios in the same process.
 */
export class BrowseTheWeb extends Ability {
	/** Playwright page used by tasks and page adapters. */
	readonly page: Page;
	private readonly context: BrowserContext;
	private actorName: string | undefined;

	/**
	 * Create and activate a browser ability.
	 *
	 * @param page Playwright page assigned to the ability.
	 * @param context Playwright browser context that owns the page.
	 * @returns The active browser ability. This also replaces the fallback used by
	 * {@link BrowseTheWeb.current} and by actors without an actor-specific
	 * registration.
	 */
	static using(page: Page, context: BrowserContext): BrowseTheWeb {
		const ability = new BrowseTheWeb(page, context);
		fallbackInstance = ability;
		return ability;
	}

	/**
	 * Register this ability for a named actor.
	 *
	 * @param name Actor name used by Serenity/JS.
	 * @returns This ability, for fluent cast setup.
	 */
	registerForActor(name: string): this {
		this.actorName = name;
		actorBrowserMap.set(name, this);
		return this;
	}

	/**
	 * Resolve the browser ability for an actor.
	 *
	 * @param actor Serenity actor or ability host.
	 * @throws Error when no actor-specific or fallback browser ability exists.
	 */
	static withActor(actor: UsesAbilities): BrowseTheWeb {
		const actorName = 'name' in actor ? (actor as Actor).name : undefined;
		if (actorName) {
			const perActor = actorBrowserMap.get(actorName);
			if (perActor) {
				return perActor;
			}
		}

		if (!fallbackInstance) {
			throw new Error('No BrowseTheWeb ability is active');
		}
		return fallbackInstance;
	}

	/**
	 * Return the active fallback browser ability, if one has been registered.
	 */
	static current(): BrowseTheWeb | undefined {
		return fallbackInstance;
	}

	private constructor(page: Page, context: BrowserContext) {
		super();
		this.page = page;
		this.context = context;
	}

	/** Browser context that owns the page. */
	get browserContext(): BrowserContext {
		return this.context;
	}

	/**
	 * Close only the current page and detach this ability from the registry.
	 */
	async closePageOnly(): Promise<void> {
		if (!this.page.isClosed()) {
			await this.page.close();
		}
		this.detach();
	}

	/**
	 * Close the page and browser context, then detach this ability.
	 */
	async close(): Promise<void> {
		if (!this.page.isClosed()) {
			await this.page.close();
		}
		await this.context.close();
		this.detach();
	}

	private detach(): void {
		if (this.actorName) {
			actorBrowserMap.delete(this.actorName);
		}
		if (fallbackInstance === this) {
			fallbackInstance = undefined;
		}
	}
}
