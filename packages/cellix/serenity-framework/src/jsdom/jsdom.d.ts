declare module 'jsdom' {
	export class JSDOM {
		constructor(html?: string, options?: Record<string, unknown>);
		readonly [key: string]: Window & typeof globalThis;
	}
}
