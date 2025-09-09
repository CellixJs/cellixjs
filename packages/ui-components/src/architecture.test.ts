/**
 * Architecture Tests for UI Components Package
 * 
 * Tests the UI layer to ensure proper component structure and separation of concerns
 */

import { describe, it } from 'vitest';
import { 
  executeArchRule,
  uiShouldNotDependOnInfrastructure,
  uiComponentsShouldHaveNoCycles,
  uiShouldNotDependOnServices,
  projectFiles,
} from '@cellix/test-core-archunit';

const testOptions = {
  enableLogging: false,
  allowEmptyTests: true,
};

describe('Architecture: UI Components Package', () => {
  describe('UI Layer Rules', () => {
    it('UI should not depend on infrastructure layer', async () => {
      await executeArchRule(uiShouldNotDependOnInfrastructure(), testOptions);
    });

    it('UI components should not have circular dependencies', async () => {
      await executeArchRule(uiComponentsShouldHaveNoCycles(), testOptions);
    });

    it('UI components should not depend on backend services', async () => {
      await executeArchRule(uiShouldNotDependOnServices(), testOptions);
    });
  });

  describe('UI Component Structure', () => {
    it('components should follow proper organization', async () => {
      const rule = projectFiles()
        .inFolder('src/components/**')
        .should()
        .haveNoCycles();
      
      await executeArchRule(rule, testOptions);
    });

    it('UI should not depend on domain entities directly', async () => {
      const rule = projectFiles()
        .inFolder('src/**')
        .shouldNot()
        .dependOnFiles()
        .inFolder('**/domain/contexts/**');
      
      await executeArchRule(rule, testOptions);
    });
  });
});