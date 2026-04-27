import * as dotenv from 'dotenv';

export function setupEnvironment(): void {
	// Load mock server environment and allow local overrides
	dotenv.config();
	dotenv.config({ path: '.env.local', override: true });
}
