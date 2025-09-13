import dotenv from 'dotenv';

export const setupEnvironment = () => {
    console.log('Setting up environment variables');
    dotenv.config();
    dotenv.config({ path: `.env.local`, override: true });
    console.log('Environment variables set up');
}