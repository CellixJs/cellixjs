/**
 * Runtime bridge to the canonical portless hostname helpers used by both the
 * dev:worktree scripts and the E2E test harness. Keeping the .mjs file as
 * the single source of truth means there is exactly one place that derives
 * hostnames from .env and applies the WORKTREE_NAME suffix.
 */
interface PortlessHostnames {
	uiCommunity: string;
	uiStaff: string;
	api: string;
	mockAuth: string;
	docs: string;
}

interface PortlessHostnamesModule {
	PORTLESS_PORT: number;
	getHostnames(): PortlessHostnames;
	buildPortlessUrl(hostname: string, path?: string): string;
}

const portlessHostnamesModuleUrl = new URL('../../../../../scripts/local-dev/portless-hostnames.mjs', import.meta.url).href;

const { buildPortlessUrl, getHostnames, PORTLESS_PORT } = (await import(portlessHostnamesModuleUrl)) as PortlessHostnamesModule;

export { buildPortlessUrl, getHostnames, PORTLESS_PORT };
