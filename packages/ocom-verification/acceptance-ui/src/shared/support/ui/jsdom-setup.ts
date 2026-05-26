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
const domGlobal = dom['window'] as unknown as Window & typeof globalThis;

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

safeAssign('window', domGlobal);
safeAssign('document', domGlobal.document);
safeAssign('navigator', domGlobal.navigator);
safeAssign('HTMLElement', domGlobal.HTMLElement);
safeAssign('HTMLInputElement', domGlobal.HTMLInputElement);
safeAssign('HTMLTextAreaElement', domGlobal.HTMLTextAreaElement);
safeAssign('HTMLFormElement', domGlobal.HTMLFormElement);
safeAssign('HTMLButtonElement', domGlobal.HTMLButtonElement);
safeAssign('HTMLSelectElement', domGlobal.HTMLSelectElement);
safeAssign('HTMLAnchorElement', domGlobal.HTMLAnchorElement);
safeAssign('Element', domGlobal.Element);
safeAssign('Node', domGlobal.Node);
safeAssign('NodeList', domGlobal.NodeList);
safeAssign('Event', domGlobal.Event);
safeAssign('CustomEvent', domGlobal.CustomEvent);
safeAssign('KeyboardEvent', domGlobal.KeyboardEvent);
safeAssign('MouseEvent', domGlobal.MouseEvent);
safeAssign('getComputedStyle', domGlobal.getComputedStyle);
safeAssign('requestAnimationFrame', (cb: () => void) => setTimeout(cb, 0));
safeAssign('cancelAnimationFrame', (id: number) => clearTimeout(id));
safeAssign('location', domGlobal.location);
safeAssign('history', domGlobal.history);
safeAssign('MutationObserver', domGlobal.MutationObserver);
safeAssign('URL', domGlobal.URL);
safeAssign('URLSearchParams', domGlobal.URLSearchParams);
safeAssign('SubmitEvent', domGlobal.SubmitEvent);

/* --- Stubs for APIs not supported by jsdom --- */

domGlobal.matchMedia =
	domGlobal.matchMedia ||
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

domGlobal.scrollTo =
	domGlobal.scrollTo ||
	(() => {
		/* noop stub */
	});
domGlobal.scroll =
	domGlobal.scroll ||
	(() => {
		/* noop stub */
	});
domGlobal.resizeTo =
	domGlobal.resizeTo ||
	(() => {
		/* noop stub */
	});

domGlobal.getComputedStyle =
	domGlobal.getComputedStyle ||
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
