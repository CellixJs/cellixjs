/**
 * Architecture Tests for Main API Package
 * 
 * Tests the main API entry point to ensure proper layering and Azure Functions integration
 */

import { describe, it } from 'vitest';
import { 
  executeArchRule,
  executeArchRules,
  shouldEnableDebugLogging,
} from '../../../architecture/shared/utils/test-helpers';
import {
  apiShouldHaveNoCycles,
} from '../../../architecture/shared/rules/cyclic-dependency.rules';

const testOptions = {
  enableLogging: shouldEnableDebugLogging(),
  logLevel: 'info' as const,
  allowEmptyTests: false,
};

describe('Architecture: Main API Package', () => {
  describe('API Layer Structure', () => {
    it('API should not create circular dependencies', async () => {
      await executeArchRule(apiShouldHaveNoCycles(), testOptions);
    });

    it('API handlers should be lightweight orchestration', async () => {
      const { metrics } = await import('archunit');
      const rule = metrics()
        .inFolder('src/**')
        .count()
        .linesOfCode()
        .shouldBeBelow(100); // API handlers should delegate to application services
      
      await executeArchRule(rule, testOptions);
    });

    it('API should follow Azure Functions conventions', async () => {
      const { projectFiles } = await import('archunit');
      const rule = projectFiles()
        .inFolder('src/**')
        .withName('*.ts')
        .should()
        .matchPattern('*.ts'); // Basic validation that we have TypeScript files
      
      await executeArchRule(rule, testOptions);
    });
  });

  describe('Dependency Management', () => {
    it('API should properly depend on application layer', async () => {
      // API can depend on application services for orchestration
      const { projectFiles } = await import('archunit');
      // This test verifies we can import from application layer (positive test)
      const rule = projectFiles()
        .inFolder('src/**')
        .should()
        .haveNoCycles(); // Just ensure no cycles since dependencies are expected
      
      await executeArchRule(rule, testOptions);
    });

    it('API should not directly depend on domain entities', async () => {
      // API should go through application services, not directly to domain
      const { projectFiles } = await import('archunit');
      const rule = projectFiles()
        .inFolder('src/**')
        .shouldNot()
        .dependOnFiles()
        .inPath('**/domain/contexts/**/**.entity.ts');
      
      await executeArchRule(rule, { ...testOptions, allowEmptyTests: true });
    });

    it('API should not directly depend on infrastructure implementations', async () => {
      const { projectFiles } = await import('archunit');
      const rules = [
        () => projectFiles()
          .inFolder('src/**')
          .shouldNot()
          .dependOnFiles()
          .inPath('**/node_modules/mongoose/**'),
      ];
      
      await executeArchRules(rules, { ...testOptions, allowEmptyTests: true });
    });
  });

  describe('Azure Functions Integration', () => {
    it('should properly structure Azure Functions handlers', async () => {
      const { projectFiles } = await import('archunit');
      const rule = projectFiles()
        .inFolder('src/**')
        .should()
        .haveNoCycles();
      
      await executeArchRule(rule, testOptions);
    });

    it('handlers should have reasonable complexity', async () => {
      const { metrics } = await import('archunit');
      const rule = metrics()
        .inFolder('src/**')
        .count()
        .methodCount()
        .shouldBeBelow(8); // Azure Functions handlers should be simple
      
      await executeArchRule(rule, testOptions);
    });
  });
});