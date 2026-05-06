import { act, fireEvent } from '@testing-library/react';
import type { ElementHandle, PageAdapter, PageNavigationWaitUntil, PageUrlMatcher } from '../page-adapter.ts';

function getGlobalDocument(container: Element): Document {
	return container.ownerDocument ?? document;
}

function findLabelControl(container: Element, text: string): Element | null {
	const labels = Array.from(container.querySelectorAll('label'));
	const matchingLabel = labels.find((label) => (label.textContent ?? '').includes(text));

	if (matchingLabel) {
		const forId = matchingLabel.getAttribute('for');
		if (forId) {
			const doc = getGlobalDocument(container);
			return doc.getElementById(forId);
		}

		const wrappedControl = matchingLabel.querySelector('input, textarea, select, [role="textbox"], [role="combobox"], [role="checkbox"]');
		if (wrappedControl) {
			return wrappedControl;
		}
	}

	const ariaMatch = container.querySelector(`[aria-label="${text}"], [aria-label*="${text}"]`);
	return ariaMatch;
}

class JsdomElementHandle implements ElementHandle {
	constructor(private readonly el: Element | null) {}

	fill(value: string): Promise<void> {
		if (!this.el) return Promise.resolve();

		const input = this.el as HTMLInputElement;
		act(() => {
			const nativeInputValueSetter = Object.getOwnPropertyDescriptor(input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value')?.set;
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
		if (this.el) {
			const el = this.el;
			act(() => {
				fireEvent.click(el);
			});
		}
		return Promise.resolve();
	}

	check(): Promise<void> {
		if (this.el instanceof HTMLInputElement) {
			const el = this.el;
			act(() => {
				fireEvent.click(el, { target: { checked: true } });
			});
			return Promise.resolve();
		}

		if (this.el) {
			const el = this.el;
			act(() => {
				fireEvent.click(el);
			});
		}
		return Promise.resolve();
	}

	textContent(): Promise<string | null> {
		return Promise.resolve(this.el?.textContent ?? null);
	}

	getAttribute(name: string): Promise<string | null> {
		return Promise.resolve(this.el?.getAttribute(name) ?? null);
	}

	isVisible(): Promise<boolean> {
		return Promise.resolve(this.el !== null);
	}

	waitFor(_options?: { state?: 'visible' | 'hidden' | 'attached' | 'detached'; timeout?: number }): Promise<void> {
		return Promise.resolve();
	}

	querySelector(selector: string): Promise<ElementHandle | null> {
		const child = this.el?.querySelector(selector) ?? null;
		return Promise.resolve(child ? new JsdomElementHandle(child) : null);
	}

	querySelectorAll(selector: string): Promise<ElementHandle[]> {
		if (!this.el) return Promise.resolve([]);
		return Promise.resolve(Array.from(this.el.querySelectorAll(selector)).map((el) => new JsdomElementHandle(el)));
	}
}

export class JsdomPageAdapter implements PageAdapter {
	constructor(private readonly container: Element) {}

	getByPlaceholder(text: string): ElementHandle {
		const el = this.container.querySelector(`[placeholder="${text}"], [placeholder*="${text}"]`);
		return new JsdomElementHandle(el);
	}

	getByLabel(text: string): ElementHandle {
		return new JsdomElementHandle(findLabelControl(this.container, text));
	}

	getByRole(role: string, options?: { name?: string | RegExp }): ElementHandle {
		const candidates = Array.from(this.container.querySelectorAll(`[role="${role}"], ${role}`));

		const semanticMap: Record<string, string> = {
			button: 'button',
			textbox: 'input[type="text"], input:not([type]), textarea',
			combobox: 'select, [role="combobox"]',
			checkbox: 'input[type="checkbox"], [role="checkbox"]',
			table: 'table',
		};
		const semanticSelector = semanticMap[role];
		if (semanticSelector) {
			const semantic = Array.from(this.container.querySelectorAll(semanticSelector));
			for (const el of semantic) {
				if (!candidates.includes(el)) candidates.push(el);
			}
		}

		const nameFilter = options?.name;
		if (nameFilter) {
			const match = candidates.find((el) => {
				const text = el.textContent ?? '';
				const ariaLabel = el.getAttribute('aria-label') ?? '';
				if (nameFilter instanceof RegExp) {
					return nameFilter.test(text) || nameFilter.test(ariaLabel);
				}
				return text.includes(nameFilter) || ariaLabel.includes(nameFilter);
			});
			return new JsdomElementHandle(match ?? null);
		}

		return new JsdomElementHandle(candidates[0] ?? null);
	}

	locator(selector: string): ElementHandle {
		const el = this.container.querySelector(selector);
		return new JsdomElementHandle(el);
	}

	locatorAll(selector: string): Promise<ElementHandle[]> {
		return Promise.resolve(Array.from(this.container.querySelectorAll(selector)).map((el) => new JsdomElementHandle(el)));
	}

	getByText(text: string | RegExp, options?: { selector?: string }): ElementHandle {
		const scope = options?.selector ? (this.container.querySelector(options.selector) ?? this.container) : this.container;
		const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
		let node: Node | null;
		// biome-ignore lint/suspicious/noAssignInExpressions: walker pattern
		while ((node = walker.nextNode())) {
			const content = node.textContent ?? '';
			const matches = text instanceof RegExp ? text.test(content) : content.includes(text);
			if (matches && node.parentElement) {
				return new JsdomElementHandle(node.parentElement);
			}
		}
		return new JsdomElementHandle(null);
	}

	goto(url: string, _options?: { timeout?: number; waitUntil?: PageNavigationWaitUntil }): Promise<void> {
		if (typeof window !== 'undefined') {
			window.history.pushState({}, '', url);
		}
		return Promise.resolve();
	}

	waitForURL(_url: PageUrlMatcher, _options?: { timeout?: number; waitUntil?: PageNavigationWaitUntil }): Promise<void> {
		return Promise.resolve();
	}

	url(): string {
		if (typeof window !== 'undefined') {
			return window.location.href;
		}
		return 'about:blank';
	}

	waitForTimeout(_timeout: number): Promise<void> {
		return Promise.resolve();
	}
}
