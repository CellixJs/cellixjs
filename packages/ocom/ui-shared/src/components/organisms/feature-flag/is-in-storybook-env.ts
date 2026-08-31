export function isInStorybookEnv(): boolean {
	return typeof globalThis.window !== 'undefined' && globalThis.window.location.pathname.includes('iframe.html');
}
