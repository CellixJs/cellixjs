const safeAssign = (name: string, value: unknown) => {
	try {
		(globalThis as Record<string, unknown>)[name] = value;
	} catch {
		Object.defineProperty(globalThis, name, {
			value,
			writable: true,
			configurable: true,
		});
	}
};

if (typeof globalThis !== 'undefined' && !globalThis.matchMedia) {
	safeAssign(
		'matchMedia',
		(query: string) => ({
			matches: false,
			media: query,
			onchange: null,
			addListener: () => undefined,
			removeListener: () => undefined,
			addEventListener: () => undefined,
			removeEventListener: () => undefined,
			dispatchEvent: () => false,
		}),
	);
}

if (typeof globalThis !== 'undefined' && !globalThis.getComputedStyle) {
	safeAssign('getComputedStyle', () => ({
		getPropertyValue: () => '',
	}));
}

if (!('ResizeObserver' in globalThis)) {
	safeAssign(
		'ResizeObserver',
		class {
			observe() {
				/* noop */
			}
			unobserve() {
				/* noop */
			}
			disconnect() {
				/* noop */
			}
		},
	);
}
