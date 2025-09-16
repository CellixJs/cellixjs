import { describe, it, expect } from 'vitest';
import { baseConfig } from './base.config.ts';

describe('baseConfig', () => {
  it('should have coverage configuration', () => {
    expect(baseConfig.test?.coverage).toBeDefined();
    expect(baseConfig.test?.coverage?.provider).toBe('v8');
    expect((baseConfig.test?.coverage as any)?.reporter).toEqual(['text', 'lcov']);
    expect(baseConfig.test?.coverage?.reportsDirectory).toBe('coverage');
  });

  it('should export a valid vitest config', () => {
    expect(baseConfig).toHaveProperty('test');
    expect(typeof baseConfig.test).toBe('object');
  });
});