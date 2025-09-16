import { describe, it, expect, vi } from 'vitest';
import { createStorybookVitestConfig, type StorybookVitestConfigOptions } from './storybook.config.ts';

// Mock the storybook plugin to avoid actually loading Storybook
vi.mock('@storybook/addon-vitest/vitest-plugin', () => ({
  storybookTest: vi.fn(() => ({ name: 'storybook-test-plugin' }))
}));

describe('createStorybookVitestConfig', () => {
  const mockPkgDirname = '/mock/package/path';

  it('should create config with default options', () => {
    const config = createStorybookVitestConfig(mockPkgDirname);
    
    expect(config.test?.projects).toBeDefined();
    expect(Array.isArray(config.test?.projects)).toBe(true);
    expect(config.test?.projects?.length).toBe(1);
    
    const project = config.test?.projects?.[0] as any;
    expect(project?.test?.name).toBe('storybook');
    expect(project?.test?.browser?.enabled).toBe(true);
    expect(project?.test?.browser?.headless).toBe(true);
    expect(project?.test?.browser?.provider).toBe('playwright');
  });

  it('should use default setup files', () => {
    const config = createStorybookVitestConfig(mockPkgDirname);
    
    const project = config.test?.projects?.[0] as any;
    expect(project?.test?.setupFiles).toEqual(['.storybook/vitest.setup.ts']);
  });

  it('should use custom setup files when provided', () => {
    const options: StorybookVitestConfigOptions = {
      setupFiles: ['custom-setup.ts', 'another-setup.ts']
    };
    
    const config = createStorybookVitestConfig(mockPkgDirname, options);
    
    const project = config.test?.projects?.[0] as any;
    expect(project?.test?.setupFiles).toEqual(['custom-setup.ts', 'another-setup.ts']);
  });

  it('should use default browser (chromium)', () => {
    const config = createStorybookVitestConfig(mockPkgDirname);
    
    const project = config.test?.projects?.[0] as any;
    expect(project?.test?.browser?.instances).toEqual([{ browser: 'chromium' }]);
  });

  it('should use custom browsers when provided', () => {
    const options: StorybookVitestConfigOptions = {
      browsers: [{ browser: 'firefox' }, { browser: 'webkit' }]
    };
    
    const config = createStorybookVitestConfig(mockPkgDirname, options);
    
    const project = config.test?.projects?.[0] as any;
    expect(project?.test?.browser?.instances).toEqual([
      { browser: 'firefox' },
      { browser: 'webkit' }
    ]);
  });

  it('should have comprehensive coverage exclusions', () => {
    const config = createStorybookVitestConfig(mockPkgDirname);
    
    const coverageExclude = config.test?.coverage?.exclude;
    expect(coverageExclude).toBeDefined();
    expect(Array.isArray(coverageExclude)).toBe(true);
    
    // Check for key exclusions
    expect(coverageExclude).toContain('**/*.config.ts');
    expect(coverageExclude).toContain('**/tsconfig.json');
    expect(coverageExclude).toContain('**/.storybook/**');
    expect(coverageExclude).toContain('**/*.stories.ts');
    expect(coverageExclude).toContain('**/*.stories.tsx');
    expect(coverageExclude).toContain('**/*.test.ts');
    expect(coverageExclude).toContain('**/*.test.tsx');
    expect(coverageExclude).toContain('dist/**');
  });

  it('should include additional coverage exclusions when provided', () => {
    const options: StorybookVitestConfigOptions = {
      additionalCoverageExclude: ['**/custom-exclude/**', '**/*.custom.ts']
    };
    
    const config = createStorybookVitestConfig(mockPkgDirname, options);
    
    const coverageExclude = config.test?.coverage?.exclude;
    expect(coverageExclude).toContain('**/custom-exclude/**');
    expect(coverageExclude).toContain('**/*.custom.ts');
  });

  it('should inherit from base config', () => {
    const config = createStorybookVitestConfig(mockPkgDirname);
    
    // Should have base config properties
    expect(config.test?.coverage?.provider).toBe('v8');
    expect((config.test?.coverage as any)?.reporter).toEqual(['text', 'lcov']);
    expect(config.test?.coverage?.reportsDirectory).toBe('coverage');
  });

  it('should have globals enabled for storybook tests', () => {
    const config = createStorybookVitestConfig(mockPkgDirname);
    
    expect(config.test?.globals).toBe(true);
  });

  it('should export a valid vitest config', () => {
    const config = createStorybookVitestConfig(mockPkgDirname);
    
    expect(config).toHaveProperty('test');
    expect(typeof config.test).toBe('object');
  });

  it('should handle custom storybook directory option', () => {
    const options: StorybookVitestConfigOptions = {
      storybookDirRelativeToPackage: 'custom-storybook'
    };
    
    // Just verify the function doesn't throw and returns a valid config
    const config = createStorybookVitestConfig(mockPkgDirname, options);
    expect(config).toBeDefined();
    expect(config.test).toBeDefined();
  });

  it('should use type definitions correctly', () => {
    // Test that TypeScript options interface works correctly
    const options: StorybookVitestConfigOptions = {
      storybookDirRelativeToPackage: '.storybook',
      setupFiles: ['setup.ts'],
      browsers: [{ browser: 'chromium' }],
      additionalCoverageExclude: ['exclude/**']
    };
    
    const config = createStorybookVitestConfig(mockPkgDirname, options);
    expect(config).toBeDefined();
  });
});