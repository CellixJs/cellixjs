import { buildRouteKey } from './internal/build-route-key.ts';

/**
 * Public router interface returned by the package root export.
 */
export interface CommandRouter {
	register(name: string, handler: () => string): void;
	dispatch(name: string): string;
}

/**
 * Create a command router that dispatches handlers by normalized command name.
 *
 * @returns A mutable router with register and dispatch methods.
 * @example
 * const router = createCommandRouter();
 */
export function createCommandRouter(): CommandRouter {
	const handlers = new Map<string, () => string>();

	return {
		register(name, handler) {
			handlers.set(buildRouteKey(name), handler);
		},
		dispatch(name) {
			const handler = handlers.get(buildRouteKey(name));

			if (!handler) {
				throw new Error(`Unknown command: ${name}`);
			}

			return handler();
		},
	};
}
