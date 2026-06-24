import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(currentDir, '../../../../..');

export const mongodbMemoryMockDir = resolve(workspaceRoot, 'apps/server-mongodb-memory-mock');
