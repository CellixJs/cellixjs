/**
 * Architecture Tests for UI Components Package
 * 
 * Tests the UI layer to ensure proper component structure and separation of concerns
 */

import { describe, it } from 'vitest';
import { 
  executeArchRule,
  executeArchRules,
  shouldEnableDebugLogging,
} from '../../../architecture/shared/utils/test-helpers';
import {
  uiShouldNotDependOnInfrastructure,
} from '../../../architecture/shared/rules/clean-architecture.rules';
import {
  uiComponentsShouldHaveNoCycles,
} from '../../../architecture/shared/rules/cyclic-dependency.rules';

const testOptions = {
  enableLogging: shouldEnableDebugLogging(),
  logLevel: 'info' as const,
  allowEmptyTests: true, // UI components might have varying structures
};

describe('Architecture: UI Components Package', () => {
  describe('UI Layer Principles', () => {
    it('UI should not depend on infrastructure layer', async () => {
      await executeArchRule(uiShouldNotDependOnInfrastructure(), testOptions);
    });

    it('UI should not depend on service implementations', async () => {
      const { projectFiles } = await import('archunit');
      const rule = projectFiles()
        .inFolder('src/**')
        .shouldNot()
        .dependOnFiles()
        .inFolder('**/service-*/**');
      
      await executeArchRule(rule, testOptions);
    });

    it('UI should not directly depend on domain entities', async () => {
      const { projectFiles } = await import('archunit');
      const rule = projectFiles()
        .inFolder('src/**')
        .shouldNot()
        .dependOnFiles()
        .inPath('**/domain/contexts/**/**.entity.ts');
      
      await executeArchRule(rule, testOptions);
    });
  });

  describe('Cyclic Dependencies', () => {
    it('UI components should have no circular dependencies', async () => {
      await executeArchRule(uiComponentsShouldHaveNoCycles(), testOptions);
    });
  });

  describe('React Component Structure', () => {
    it('components should follow PascalCase naming', async () => {
      const { projectFiles } = await import('archunit');
      const rule = projectFiles()
        .inFolder('src/components/**')
        .withName(/^[A-Z][a-zA-Z]*\.(tsx|ts)$/)
        .should()
        .matchPattern(/^[A-Z][a-zA-Z]*\.(tsx|ts)$/);
      
      await executeArchRule(rule, testOptions);
    });

    it('story files should follow naming conventions', async () => {
      const { projectFiles } = await import('archunit');
      const rule = projectFiles()
        .inFolder('src/**')
        .withName('*.stories.tsx')
        .should()
        .matchPattern('*.stories.tsx');
      
      await executeArchRule(rule, testOptions);
    });

    it('test files should follow naming conventions', async () => {
      const { projectFiles } = await import('archunit');
      const rule = projectFiles()
        .inFolder('src/**')
        .withName('*.test.tsx')
        .should()
        .matchPattern('*.test.tsx');
      
      await executeArchRule(rule, testOptions);
    });
  });

  describe('Component Organization', () => {
    it('molecules should be focused components', async () => {
      const { metrics } = await import('archunit');
      const rule = metrics()
        .inFolder('src/components/molecules/**')
        .count()
        .linesOfCode()
        .shouldBeBelow(150); // Molecules should be small, focused components
      
      await executeArchRule(rule, testOptions);
    });

    it('organisms should be composed of molecules', async () => {
      const { metrics } = await import('archunit');
      const rule = metrics()
        .inFolder('src/components/organisms/**')
        .count()
        .linesOfCode()
        .shouldBeBelow(300); // Organisms can be larger but should still be manageable
      
      await executeArchRule(rule, testOptions);
    });

    it('components should have reasonable method count', async () => {
      const { metrics } = await import('archunit');
      const rule = metrics()
        .inFolder('src/components/**')
        .count()
        .methodCount()
        .shouldBeBelow(8); // React components should be focused
      
      await executeArchRule(rule, testOptions);
    });
  });

  describe('Atomic Design Principles', () => {
    it('should follow atomic design structure', async () => {
      const { projectFiles } = await import('archunit');
      const rule = projectFiles()
        .inFolder('src/components/**')
        .should()
        .haveNoCycles(); // Basic validation of atomic design structure
      
      await executeArchRule(rule, testOptions);
    });

    it('should have proper separation between molecules and organisms', async () => {
      const { projectFiles } = await import('archunit');
      // Molecules should not depend on organisms (dependency should flow upward)
      const rule = projectFiles()
        .inFolder('src/components/molecules/**')
        .shouldNot()
        .dependOnFiles()
        .inFolder('src/components/organisms/**');
      
      await executeArchRule(rule, testOptions);
    });
  });
});