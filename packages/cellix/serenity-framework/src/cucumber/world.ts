import { type IWorldOptions, setWorldConstructor, World } from '@cucumber/cucumber';
import { type Cast, engage } from '@serenity-js/core';

/** Infrastructure shape consumed by managed Serenity worlds. */
export interface ManagedSerenityWorldInfrastructure<TState> {
	/** Start the suite infrastructure before the scenario uses actors. */
	ensureStarted: () => Promise<void>;

	/** Reset mutable scenario state after each scenario. */
	resetScenarioState?: () => Promise<void>;

	/** Stop suite infrastructure after all scenarios. */
	stopAll?: () => Promise<void>;

	/** Return state needed to construct the scenario cast. */
	getState: () => TState;
}

/** Options used by {@link ManagedSerenityWorld}. */
export interface ManagedSerenityWorldOptions<TState> {
	/** Infrastructure object that owns server and browser lifecycle. */
	infrastructure: ManagedSerenityWorldInfrastructure<TState>;

	/** Builds the cast after infrastructure has started. */
	createCast: (state: TState) => Cast;

	/** Optional state assertion run before the cast is engaged. */
	validateState?: (state: TState) => void;
}

/**
 * Base Cucumber world that wires infrastructure state into Serenity/JS.
 *
 * Extend this class when a suite needs app-specific world methods, or use
 * {@link createManagedSerenityWorldClass} when the suite only needs `init` and
 * `cleanup`. Consumers supply configuration; the repeated startup, cast
 * engagement, and scenario reset pattern stays in the framework.
 */
export class ManagedSerenityWorld<TState> extends World {
	/**
	 * @param options Cucumber world options.
	 * @param config Infrastructure and cast configuration.
	 */
	constructor(
		options: IWorldOptions,
		private readonly config: ManagedSerenityWorldOptions<TState>,
	) {
		super(options);
	}

	/** Start infrastructure and engage a Serenity cast for the scenario. */
	async init(): Promise<void> {
		await this.config.infrastructure.ensureStarted();
		const state = this.config.infrastructure.getState();
		this.config.validateState?.(state);
		engage(this.config.createCast(state));
	}

	/** Reset scenario state through the configured infrastructure. */
	async cleanup(): Promise<void> {
		await this.config.infrastructure.resetScenarioState?.();
	}
}

/**
 * Create a Cucumber world class from managed Serenity world configuration.
 *
 * @param config Infrastructure and cast configuration.
 */
export function createManagedSerenityWorldClass<TState>(config: ManagedSerenityWorldOptions<TState>): typeof ManagedSerenityWorld<TState> {
	return class ConfiguredManagedSerenityWorld extends ManagedSerenityWorld<TState> {
		/** Create the configured world. */
		constructor(options: IWorldOptions) {
			super(options, config);
		}
	};
}

/**
 * Register a managed Serenity world with Cucumber and return the class.
 *
 * @param config Infrastructure and cast configuration.
 */
export function registerManagedSerenityWorld<TState>(config: ManagedSerenityWorldOptions<TState>): typeof ManagedSerenityWorld<TState> {
	const WorldClass = createManagedSerenityWorldClass(config);
	setWorldConstructor(WorldClass);
	return WorldClass;
}
