import { projectFiles } from 'archunit';
import { describe, expect, it } from 'vitest';

describe('API Dependency Rules', () => {
    describe('API Package', () => {
        it('should not import any @cellix/service-* package directly from src/index.ts', async () => {
            const violations: string[] = [];
            let matchedTargetFile = false;

            await projectFiles()
                .inPath('src/index.ts')
                .should()
                .adhereTo((file) => {
                    matchedTargetFile = true;
                    const hasForbiddenImport = /from\s+['"]@cellix\/service-[^'"]+['"]/.test(file.content);
                    if (hasForbiddenImport) {
                        violations.push(`[${file.path}] Must not import from @cellix/service-* packages directly in src/index.ts`);
                        return false;
                    }
                    return true;
                }, 'API src/index.ts must not import from @cellix/service-* packages directly')
                .check();

            expect(matchedTargetFile).toBe(true);
            expect(violations).toStrictEqual([]);
        });
    });
});
