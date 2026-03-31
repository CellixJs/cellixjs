import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { it, expect } from 'vitest';
import { getDirnameFromImportMetaUrl } from './dirname.ts';

it('returns the directory name for a given import.meta.url string', () => {
  const absPath = path.resolve('packages/cellix/config-vitest/src/utils/dirname.ts');
  const fileUrl = pathToFileURL(absPath).href;
  const result = getDirnameFromImportMetaUrl(fileUrl);
  expect(result).toBe(path.dirname(absPath));
});
