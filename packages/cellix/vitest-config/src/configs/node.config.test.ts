import { describe, it, expect } from 'vitest';
import { nodeConfig } from './node.config.ts';

describe('nodeConfig', () => {
  it('should have node environment configuration', () => {
    expect((nodeConfig as any).test?.environment).toBe('node');
    expect((nodeConfig as any).test?.testTimeout).toBe(5000);
    expect((nodeConfig as any).test?.include).toEqual(['src/**/*.test.ts']);
  });

  it('should have comprehensive coverage exclusions', () => {
    const coverageExclude = (nodeConfig as any).test?.coverage?.exclude;
    expect(coverageExclude).toBeDefined();
    expect(Array.isArray(coverageExclude)).toBe(true);
    
    // Check for key exclusions
    expect(coverageExclude).toContain('**/*.test.*');
    expect(coverageExclude).toContain('**/*.spec.*');
    expect(coverageExclude).toContain('**/*.stories.*');
    expect(coverageExclude).toContain('**/*.d.ts');
    expect(coverageExclude).toContain('dist/**');
    expect(coverageExclude).toContain('node_modules/**');
    expect(coverageExclude).toContain('**/.storybook/**');
  });

  it('should inherit from base config', () => {
    // Should have base config properties like coverage provider
    expect((nodeConfig as any).test?.coverage?.provider).toBe('v8');
    expect((nodeConfig as any).test?.coverage?.reporter).toEqual(['text', 'lcov']);
    expect((nodeConfig as any).test?.coverage?.reportsDirectory).toBe('coverage');
  });

  it('should export a valid vitest config', () => {
    expect(nodeConfig).toHaveProperty('test');
    expect(typeof (nodeConfig as any).test).toBe('object');
  });
});