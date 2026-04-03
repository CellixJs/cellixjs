import dotenv from 'dotenv';

export const setupEnvironment = () => {
	dotenv.config();
	dotenv.config({ path: '.env.local', override: true });
};
