import { type MockOAuth2ServerConfig, startMockOAuth2Server } from '@cellix/server-oauth2-mock-seedwork';
import { parseConfigs } from './config2';
import { setupEnvironment } from './setup-environment.ts';

setupEnvironment();

// Build one or more configs from environment
let configs: (MockOAuth2ServerConfig & { name?: string })[];
try {
	configs = parseConfigs(process.env as unknown as Record<string, string>);
} catch (err: unknown) {
	console.error('Failed to parse OIDC configuration(s):', (err as Error).message);
	process.exit(1);
}

// Start each configured server instance
const handles = new Map<string, { disposer: { stop: () => Promise<void> } }>();

try {
	for (const cfg of configs) {
		const name = (cfg as unknown as { name?: string }).name ?? 'default';
		console.log(`Starting mock OAuth2 server '${name}' on ${cfg.baseUrl} (port ${cfg.port})`);
		const handle = await startMockOAuth2Server(cfg);
		handles.set(name, { disposer: handle.disposer });
	}

	const shutdown = async (signal?: string, exitCode = 0) => {
		console.log(`Shutting down mock OAuth2 server(s) (${signal ?? 'signal'})`);
		try {
			await Promise.all(Array.from(handles.values()).map((h) => h.disposer.stop()));
		} catch (err) {
			console.error('Error during shutdown of mock servers:', err);
		} finally {
			process.exit(exitCode);
		}
	};

	process.once('SIGINT', () => void shutdown('SIGINT'));
	process.once('SIGTERM', () => void shutdown('SIGTERM'));
	process.once('SIGQUIT', () => void shutdown('SIGQUIT'));
	process.once('uncaughtException', async (err) => {
		console.error('Uncaught exception, shutting down:', err);
		await shutdown('uncaughtException', 1);
	});
	process.once('unhandledRejection', async (reason) => {
		console.error('Unhandled rejection, shutting down:', reason);
		await shutdown('unhandledRejection', 1);
	});
} catch (error: unknown) {
	console.error('Failed to start mock OAuth2 server(s):', error);
	process.exit(1);
}
