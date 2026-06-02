import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('apps/api architecture', () => {
	it('does not import any @cellix/service-* package directly from src/index.ts', () => {
		const source = readFileSync(new URL('./index.ts', import.meta.url), 'utf8');

		expect(source).not.toMatch(/from ['"]@cellix\/service-[^'"]+['"]/);
	});
});
