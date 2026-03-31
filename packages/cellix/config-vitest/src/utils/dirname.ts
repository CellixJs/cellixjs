import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function getDirnameFromImportMetaUrl(importMetaUrl: string): string {
  return path.dirname(fileURLToPath(importMetaUrl));
}
