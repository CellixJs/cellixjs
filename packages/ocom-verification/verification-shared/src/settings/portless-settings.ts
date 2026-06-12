interface PortlessHostnames {
	uiCommunity: string;
	uiStaff: string;
	api: string;
	mockAuth: string;
	docs: string;
}

const PORTLESS_PORT = 1355;

function buildPortlessUrl(hostname: string, path = ''): string {
	return `https://${hostname}:${PORTLESS_PORT}${path}`;
}

function getHostnames(): PortlessHostnames {
	const hostnames = {
		uiCommunity: requireHostname('VITE_APP_UI_COMMUNITY_BASE_URL'),
		uiStaff: requireHostname('VITE_APP_UI_STAFF_AAD_REDIRECT_URI'),
		api: requireHostname('VITE_COMMON_API_ENDPOINT'),
		mockAuth: requireHostname('VITE_APP_UI_COMMUNITY_B2C_AUTHORITY'),
	};
	const { WORKTREE_NAME: worktreeName = '' } = process.env;

	return applyWorktreeSuffixes(hostnames, worktreeName);
}

function hostnameFrom(url: string): string | null {
	try {
		return new URL(url).hostname;
	} catch {
		return null;
	}
}

function requireHostname(key: string): string {
	const hostname = hostnameFrom(process.env[key] ?? '');
	if (!hostname) {
		throw new Error(`portless-settings: required env var ${key} is missing or invalid`);
	}
	return hostname;
}

function applyWorktreeSuffixes(hostnames: Omit<PortlessHostnames, 'docs'>, worktreeName: string): PortlessHostnames {
	return {
		uiCommunity: applyWorktreeSuffix(hostnames.uiCommunity, worktreeName),
		uiStaff: applyWorktreeSuffix(hostnames.uiStaff, worktreeName),
		api: applyWorktreeSuffix(hostnames.api, worktreeName),
		mockAuth: applyWorktreeSuffix(hostnames.mockAuth, worktreeName),
		docs: applyWorktreeSuffix(`docs.${hostnames.uiCommunity}`, worktreeName),
	};
}

function applyWorktreeSuffix(hostname: string, worktreeName: string): string {
	if (!worktreeName) return hostname;
	return hostname.replace('.localhost', `.${worktreeName}.localhost`);
}

export { buildPortlessUrl, getHostnames, PORTLESS_PORT };
