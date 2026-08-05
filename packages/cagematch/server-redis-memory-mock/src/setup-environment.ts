import dotenv from 'dotenv';

export function setupEnvironment(): void {
	console.log('Setting up Redis memory server environment variables');
	dotenv.config();
	dotenv.config({ path: '.env.local', override: true });
	console.log('Redis memory server environment variables set up');
}
