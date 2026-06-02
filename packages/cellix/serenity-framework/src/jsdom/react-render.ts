import { type RenderResult, render } from '@testing-library/react';
import type React from 'react';

/** Wraps a rendered React element before it is mounted. */
export type ReactRenderWrapper = (children: React.ReactElement) => React.ReactElement;

/** Options used by {@link mountComponent}. */
export interface ReactMountOptions {
	/** Optional wrapper used for providers such as routing, theme, or GraphQL. */
	wrapper?: ReactRenderWrapper;
}

let rendered: RenderResult | null = null;

/**
 * Mount a React element into the active jsdom document.
 *
 * Any previously mounted element is unmounted first so component-level
 * acceptance tests do not leak state between scenarios.
 *
 * @param ui React element to mount.
 * @param options Optional provider wrapper.
 * @returns Testing Library render result for the mounted component.
 */
export function mountComponent(ui: React.ReactElement, options?: ReactMountOptions): RenderResult {
	unmountComponent();

	rendered = render(options?.wrapper ? options.wrapper(ui) : ui);
	return rendered;
}

/**
 * Unmount the currently mounted component, when one exists.
 */
export function unmountComponent(): void {
	if (rendered) {
		rendered.unmount();
		rendered = null;
	}
}

/**
 * Return the current Testing Library render result.
 */
export function getRendered(): RenderResult | null {
	return rendered;
}
