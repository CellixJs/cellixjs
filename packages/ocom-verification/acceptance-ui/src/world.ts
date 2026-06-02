import { ManagedSerenityWorld, type ManagedSerenityWorldOptions } from '@cellix/serenity-framework/cucumber';
import { SerenityCast } from '@cellix/serenity-framework/serenity';
import { type IWorldOptions, setWorldConstructor } from '@cucumber/cucumber';

const uiWorldConfig: ManagedSerenityWorldOptions<Record<string, never>> = {
	infrastructure: {
		ensureStarted: () => Promise.resolve(),
		getState: () => ({}),
	},
	createCast: () => new SerenityCast({ useNotepad: true }),
};

export class CellixUiWorld extends ManagedSerenityWorld<Record<string, never>> {
	private communityContainer: HTMLElement | null = null;
	private communityActorName = '';
	private headerContainer: HTMLElement | null = null;

	constructor(options: IWorldOptions) {
		super(options, uiWorldConfig);
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

	setHeaderContainer(container: HTMLElement): void {
		this.headerContainer = container;
	}

	getHeaderContainer(): HTMLElement {
		if (!this.headerContainer) {
			throw new Error('No header container available — did the Given step run?');
		}
		return this.headerContainer;
	}
}

setWorldConstructor(CellixUiWorld);
