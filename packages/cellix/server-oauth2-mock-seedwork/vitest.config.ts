import path from 'node:path';
import { nodeConfig } from '@cellix/config-vitest';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
    nodeConfig,
    defineConfig({
        test: {
            include: ['tests/**/*.test.ts'],
            environment: 'node',
        },
        resolve: {
            alias: {
                '@cellix/server-oauth2-mock-seedwork': path.resolve(__dirname, 'src/index.ts'),
            },
        },
    }),
);