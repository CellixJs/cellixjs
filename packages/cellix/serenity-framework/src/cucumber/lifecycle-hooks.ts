import { After, AfterAll, Before, type ITestCaseHookParameter, type IWorld, setDefaultTimeout } from '@cucumber/cucumber';

/** Lifecycle callbacks used by {@link registerWorldLifecycleHooks}. */
export interface WorldLifecycleHooks<TWorld extends IWorld = IWorld> {
	/** Scenario timeout in milliseconds. */
	scenarioTimeout?: number;

	/** Optional timeout for the before hook. */
	beforeTimeout?: number;

	/** Optional timeout for the after hook. */
	afterTimeout?: number;

	/** Called before each scenario. */
	before?: (world: TWorld) => Promise<void> | void;

	/** Called after each scenario. */
	after?: (world: TWorld, parameter: ITestCaseHookParameter) => Promise<void> | void;

	/** Called once after all scenarios complete. */
	afterAll?: () => Promise<void> | void;
}

/**
 * Register common Cucumber world lifecycle hooks.
 *
 * @param hooks Hook callbacks and timeouts for a test package.
 */
export function registerWorldLifecycleHooks<TWorld extends IWorld = IWorld>(hooks: WorldLifecycleHooks<TWorld>): void {
	if (hooks.scenarioTimeout) {
		setDefaultTimeout(hooks.scenarioTimeout);
	}

	Before(hooks.beforeTimeout === undefined ? {} : { timeout: hooks.beforeTimeout }, async function (this: IWorld) {
		await hooks.before?.(this as TWorld);
	});

	After(hooks.afterTimeout === undefined ? {} : { timeout: hooks.afterTimeout }, async function (this: IWorld, parameter: ITestCaseHookParameter) {
		await hooks.after?.(this as TWorld, parameter);
	});

	if (hooks.afterAll) {
		AfterAll(async () => {
			await hooks.afterAll?.();
		});
	}
}
