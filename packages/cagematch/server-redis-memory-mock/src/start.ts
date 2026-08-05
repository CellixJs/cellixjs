import { startAppRedisMemoryServer } from './index.ts';
import { setupEnvironment } from './setup-environment.ts';

setupEnvironment();

startAppRedisMemoryServer().catch((error: unknown) => {
	console.error('Failed to start Redis memory server:', error);
	process.exit(1);
});
