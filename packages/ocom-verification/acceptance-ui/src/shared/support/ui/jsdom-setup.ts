/**
 * JSDOM environment setup — initialises global browser APIs that libraries like
 * antd or React Router rely on at import time.
 *
 * Must be imported before any React component code runs.
 */

import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><div id="root"></div>', {
	url: 'http://localhost:3000',
	pretendToBeVisual: true,
});

// biome-ignore lint/suspicious/noExplicitAny: attaching browser globals requires dynamic property assignment
const g = globalThis as any;

/**
 * Safely assign a global — falls back to Object.defineProperty when the
 * property is read-only (e.g. `navigator` in Node 22).
 */
const safeAssign = (name: string, value: unknown) => {
	try {
		g[name] = value;
	} catch {
		Object.defineProperty(globalThis, name, {
			value,
			writable: true,
			configurable: true,
		});
	}
};

safeAssign('window', dom.window);
safeAssign('document', dom.window.document);
safeAssign('navigator', dom.window.navigator);
safeAssign('HTMLElement', dom.window.HTMLElement);
safeAssign('HTMLInputElement', dom.window.HTMLInputElement);
safeAssign('HTMLTextAreaElement', dom.window.HTMLTextAreaElement);
safeAssign('HTMLFormElement', dom.window.HTMLFormElement);
safeAssign('HTMLButtonElement', dom.window.HTMLButtonElement);
safeAssign('HTMLSelectElement', dom.window.HTMLSelectElement);
safeAssign('HTMLAnchorElement', dom.window.HTMLAnchorElement);
safeAssign('Element', dom.window.Element);
safeAssign('Node', dom.window.Node);
safeAssign('NodeList', dom.window.NodeList);
safeAssign('Event', dom.window.Event);
safeAssign('CustomEvent', dom.window.CustomEvent);
safeAssign('KeyboardEvent', dom.window.KeyboardEvent);
safeAssign('MouseEvent', dom.window.MouseEvent);
safeAssign('getComputedStyle', dom.window.getComputedStyle);
safeAssign('requestAnimationFrame', (cb: () => void) => setTimeout(cb, 0));
safeAssign('cancelAnimationFrame', (id: number) => clearTimeout(id));
safeAssign('location', dom.window.location);
safeAssign('history', dom.window.history);
safeAssign('MutationObserver', dom.window.MutationObserver);
safeAssign('URL', dom.window.URL);
safeAssign('URLSearchParams', dom.window.URLSearchParams);
safeAssign('SubmitEvent', dom.window.SubmitEvent);

/* --- Stubs for APIs not supported by jsdom --- */

g.window.matchMedia =
	g.window.matchMedia ||
	(() => ({
		matches: false,
		addListener: () => {
			/* noop stub */
		},
		removeListener: () => {
			/* noop stub */
		},
		addEventListener: () => {
			/* noop stub */
		},
		removeEventListener: () => {
			/* noop stub */
		},
		dispatchEvent: () => false,
		media: '',
		onchange: null,
	}));

g.ResizeObserver =
	g.ResizeObserver ||
	class {
		observe() {
			/* noop stub */
		}
		unobserve() {
			/* noop stub */
		}
		disconnect() {
			/* noop stub */
		}
	};

g.IntersectionObserver =
	g.IntersectionObserver ||
	class {
		observe() {
			/* noop stub */
		}
		unobserve() {
			/* noop stub */
		}
		disconnect() {
			/* noop stub */
		}
	};

g.window.scrollTo =
	g.window.scrollTo ||
	(() => {
		/* noop stub */
	});
g.window.scroll =
	g.window.scroll ||
	(() => {
		/* noop stub */
	});
g.window.resizeTo =
	g.window.resizeTo ||
	(() => {
		/* noop stub */
	});

g.window.getComputedStyle =
	g.window.getComputedStyle ||
	(() => ({
		getPropertyValue: () => '',
	}));

g.document.elementFromPoint = g.document.elementFromPoint || (() => null);
g.document.elementsFromPoint = g.document.elementsFromPoint || (() => []);

// jsdom does not implement form.requestSubmit(), but clicking a submit button
// uses it internally. Dispatch a cancelable submit event so form handlers can
// drive test state the same way a browser-backed form flow would.
g.HTMLFormElement.prototype.requestSubmit = function requestSubmit(submitter?: HTMLElement) {
	if (typeof this.checkValidity === 'function' && !this.checkValidity()) {
		return;
	}

	const submitEvent = new g.Event('submit', {
		bubbles: true,
		cancelable: true,
	});

	Object.defineProperty(submitEvent, 'submitter', {
		value: submitter ?? null,
		configurable: true,
	});

	this.dispatchEvent(submitEvent);
};
