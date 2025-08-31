import { describe, it, expect } from 'vitest';

describe('index', () => {
  it('should export the required functions and types', async () => {
    const exported = await import('./index.js');

    expect(exported.graphHandlerCreator).toBeDefined();
    expect(exported.startServerAndCreateHandler).toBeDefined();
    expect(typeof exported.graphHandlerCreator).toBe('function');
    expect(typeof exported.startServerAndCreateHandler).toBe('function');
  });
});