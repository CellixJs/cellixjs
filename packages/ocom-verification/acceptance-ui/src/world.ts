import { setWorldConstructor, World } from '@cucumber/cucumber';
import { type Cast, serenity } from '@serenity-js/core';
import { CellixUiCast } from './shared/support/cast.ts';

export class CellixUiWorld extends World {
	private cast!: Cast;
	private communityContainer: HTMLElement | null = null;
	private communityActorName = '';

	init(): Promise<void> {
		this.cast = new CellixUiCast();
		serenity.engage(this.cast);
		return Promise.resolve();
	}

	setCommunityContainer(container: HTMLElement): void {
		this.communityContainer = container;
	}

	getCommunityContainer(): HTMLElement {
		if (!this.communityContainer) {
			throw new Error('No community container available — did the Given step run?');
		}
		return this.communityContainer;
	}

	setCommunityActorName(actorName: string): void {
		this.communityActorName = actorName;
	}

	getCommunityActorName(): string {
		return this.communityActorName;
	}
}

setWorldConstructor(CellixUiWorld);
