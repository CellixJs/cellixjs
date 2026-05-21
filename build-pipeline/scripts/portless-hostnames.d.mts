export const PORTLESS_PORT: number;

export interface PortlessHostnames {
	uiCommunity: string;
	uiStaff: string;
	api: string;
	mockAuth: string;
	docs: string;
}

export function getHostnames(): PortlessHostnames;

export function buildPortlessUrl(hostname: string, path?: string): string;
