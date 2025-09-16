import { describe, it, expect } from 'vitest';
import { baseConfig, nodeConfig, createStorybookVitestConfig } from './index.ts';

describe('vitest-config exports', () => {
  it('should export baseConfig', () => {
    expect(baseConfig).toBeDefined();
    expect(baseConfig.test?.coverage?.provider).toBe('v8');
  });

  it('should export nodeConfig', () => {
    expect(nodeConfig).toBeDefined();
    expect((nodeConfig as any).test?.environment).toBe('node');
  });

  it('should export createStorybookVitestConfig function', () => {
    expect(createStorybookVitestConfig).toBeDefined();
    expect(typeof createStorybookVitestConfig).toBe('function');
  });

  it('should export StorybookVitestConfigOptions type correctly', () => {
    // Test that the function accepts the correct options interface
    const config = createStorybookVitestConfig('/test', {
      storybookDirRelativeToPackage: '.storybook',
      setupFiles: ['setup.ts'],
      browsers: [{ browser: 'chromium' }],
      additionalCoverageExclude: ['exclude/**']
    });
    
    expect(config).toBeDefined();
    expect(config.test).toBeDefined();
  });

  it('should have consistent exports', () => {
    // Ensure all exports are available and properly typed
    expect(baseConfig).toHaveProperty('test');
    expect(nodeConfig).toHaveProperty('test');
    expect(typeof createStorybookVitestConfig).toBe('function');
  });
});