import { act, fireEvent } from '@testing-library/react';
import type { ElementHandle, ElementWaitOptions, PageAdapter, PageNavigationOptions, PageUrlMatcher } from '../page-adapter.ts';

function getGlobalDocument(container: Element): Document {
	return container.ownerDocument ?? document;
}

function findLabelControl(container: Element, text: string): Element | null {
	const labels = Array.from(container.querySelectorAll('label'));
	const matchingLabel = labels.find((label) => (label.textContent ?? '').includes(text));

	if (matchingLabel) {
		const forId = matchingLabel.getAttribute('for');
		if (forId) {
			return getGlobalDocument(container).getElementById(forId);
		}

		const wrappedControl = matchingLabel.querySelector('input, textarea, select, [role="textbox"], [role="combobox"], [role="checkbox"]');
		if (wrappedControl) {
			return wrappedControl;
		}
	}

	return container.querySelector(`[aria-label="${text}"], [aria-label*="${text}"]`);
}

/**
 * Element handle backed by an in-process DOM `Element` (happy-dom or jsdom).
 */
export class DomElementHandle implements ElementHandle {
	/**
	 * @param element Element to adapt, or `null` for a missing selection.
	 */
	constructor(private readonly element: Element | null) {}

	fill(value: string): Promise<void> {
		if (!(this.element instanceof HTMLInputElement || this.element instanceof HTMLTextAreaElement)) {
			return Promise.resolve();
		}

		const input = this.element;
		const proto = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;

		act(() => {
			const nativeInputValueSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;

			if (nativeInputValueSetter) {
				nativeInputValueSetter.call(input, value);
			} else {
				input.value = value;
			}

			fireEvent.input(input, { target: { value } });
			fireEvent.change(input, { target: { value } });
		});

		return Promise.resolve();
	}

	click(): Promise<void> {
		if (this.element) {
			const element = this.element;
			act(() => {
				fireEvent.click(element);
			});
		}
		return Promise.resolve();
	}

	check(): Promise<void> {
		if (this.element instanceof HTMLInputElement) {
			const element = this.element;
			act(() => {
				fireEvent.click(element, { target: { checked: true } });
			});
			return Promise.resolve();
		}

		return this.click();
	}

	textContent(): Promise<string | null> {
		return Promise.resolve(this.element?.textContent ?? null);
	}

	getAttribute(name: string): Promise<string | null> {
		return Promise.resolve(this.element?.getAttribute(name) ?? null);
	}

	isVisible(): Promise<boolean> {
		return Promise.resolve(this.element !== null);
	}

	waitFor(_options?: ElementWaitOptions): Promise<void> {
		return Promise.resolve();
	}

	querySelector(selector: string): Promise<ElementHandle | null> {
		const child = this.element?.querySelector(selector) ?? null;
		return Promise.resolve(child ? new DomElementHandle(child) : null);
	}

	querySelectorAll(selector: string): Promise<ElementHandle[]> {
		if (!this.element) {
			return Promise.resolve([]);
		}
		return Promise.resolve(Array.from(this.element.querySelectorAll(selector)).map((element) => new DomElementHandle(element)));
	}
}

/**
 * Page adapter backed by an in-process DOM container element.
 *
 * Use this adapter in component-level Cucumber tests that render React into an
 * in-process DOM (happy-dom or jsdom) while reusing the same page-object
 * classes used by browser E2E tests.
 */
export class DomPageAdapter implements PageAdapter {
	/**
	 * @param container Root element that scopes all selections for this page.
	 */
	constructor(private readonly container: Element) {}

	getByPlaceholder(text: string): ElementHandle {
		return new DomElementHandle(this.container.querySelector(`[placeholder="${text}"], [placeholder*="${text}"]`));
	}

	getByLabel(text: string): ElementHandle {
		return new DomElementHandle(findLabelControl(this.container, text));
	}

	getByRole(role: string, options?: { name?: string | RegExp }): ElementHandle {
		const candidates = Array.from(this.container.querySelectorAll(`[role="${role}"], ${role}`));
		const semanticMap: Record<string, string> = {
			button: 'button',
			checkbox: 'input[type="checkbox"], [role="checkbox"]',
			combobox: 'select, [role="combobox"]',
			table: 'table',
			textbox: 'input[type="text"], input:not([type]), textarea',
		};
		const semanticSelector = semanticMap[role];

		if (semanticSelector) {
			for (const element of Array.from(this.container.querySelectorAll(semanticSelector))) {
				if (!candidates.includes(element)) {
					candidates.push(element);
				}
			}
		}

		const nameFilter = options?.name;
		if (nameFilter) {
			const match = candidates.find((element) => {
				const textContent = element.textContent ?? '';
				const ariaLabel = element.getAttribute('aria-label') ?? '';
				return nameFilter instanceof RegExp ? nameFilter.test(textContent) || nameFilter.test(ariaLabel) : textContent.includes(nameFilter) || ariaLabel.includes(nameFilter);
			});
			return new DomElementHandle(match ?? null);
		}

		return new DomElementHandle(candidates[0] ?? null);
	}

	locator(selector: string): ElementHandle {
		return new DomElementHandle(this.container.querySelector(selector));
	}

	locatorAll(selector: string): Promise<ElementHandle[]> {
		return Promise.resolve(Array.from(this.container.querySelectorAll(selector)).map((element) => new DomElementHandle(element)));
	}

	getByText(text: string | RegExp, options?: { selector?: string }): ElementHandle {
		const scope = options?.selector ? (this.container.querySelector(options.selector) ?? this.container) : this.container;
		const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
		let node: Node | null;
		// biome-ignore lint/suspicious/noAssignInExpressions: tree walkers expose the next node through assignment.
		while ((node = walker.nextNode())) {
			const content = node.textContent ?? '';
			const matches = text instanceof RegExp ? text.test(content) : content.includes(text);
			if (matches && node.parentElement) {
				return new DomElementHandle(node.parentElement);
			}
		}
		return new DomElementHandle(null);
	}

	goto(url: string, _options?: PageNavigationOptions): Promise<void> {
		globalThis.history?.pushState({}, '', url);
		return Promise.resolve();
	}

	waitForURL(_url: PageUrlMatcher, _options?: PageNavigationOptions): Promise<void> {
		return Promise.resolve();
	}

	url(): string {
		return globalThis.location?.href ?? 'about:blank';
	}

	waitForTimeout(_timeout: number): Promise<void> {
		return Promise.resolve();
	}
}
