import { join } from 'node:path';
import { getDirnameFromImportMetaUrl, nodeConfig } from '@cellix/config-vitest';
import { mergeConfig } from 'vitest/config';

const dirname = getDirnameFromImportMetaUrl(import.meta.url);

export default mergeConfig(
nodeConfig,
{
test: {
typecheck: {
tsconfig: './tsconfig.vitest.json',
},
},
resolve: {
alias: {
'@cellix/server-oauth2-mock-seedwork': join(dirname, 'src/index.ts'),
},
},
},
);
