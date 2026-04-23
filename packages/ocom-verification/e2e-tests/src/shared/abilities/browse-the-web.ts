import type { BrowserContext, Page } from '@playwright/test';
import { Ability, type Actor, type UsesAbilities } from '@serenity-js/core';

const actorBrowserMap = new Map<string, BrowseTheWeb>();
let fallbackInstance: BrowseTheWeb | undefined;

export class BrowseTheWeb extends Ability {
	readonly page: Page;
	private readonly context: BrowserContext;
	private actorName: string | undefined;

	static using(page: Page, context: BrowserContext): BrowseTheWeb {
		const ability = new BrowseTheWeb(page, context);
		fallbackInstance = ability;
		return ability;
	}

	registerForActor(name: string): this {
		this.actorName = name;
		actorBrowserMap.set(name, this);
		return this;
	}

	static withActor(actor: UsesAbilities): BrowseTheWeb {
		const actorName = 'name' in actor ? (actor as Actor).name : undefined;
		if (actorName) {
			const perActor = actorBrowserMap.get(actorName);
			if (perActor) return perActor;
		}

		if (!fallbackInstance) {
			throw new Error('No BrowseTheWeb ability is active');
		}
		return fallbackInstance;
	}

	static as(actor: UsesAbilities): BrowseTheWeb {
		return BrowseTheWeb.withActor(actor);
	}

	static current(): BrowseTheWeb | undefined {
		return fallbackInstance;
	}

	private constructor(page: Page, context: BrowserContext) {
		super();
		this.page = page;
		this.context = context;
	}

	get browserContext(): BrowserContext {
		return this.context;
	}

	async closePageOnly(): Promise<void> {
		if (!this.page.isClosed()) {
			await this.page.close();
		}
		this.detach();
	}

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
