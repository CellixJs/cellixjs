import { mergeConfig } from 'vitest/config';
import { nodeConfig } from './src/configs/node.config.ts';

export default mergeConfig(nodeConfig, {});
