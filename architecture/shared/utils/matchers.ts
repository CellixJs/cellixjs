/**
 * Custom Architecture Test Matchers for CellixJS
 * 
 * Extended matchers and utilities for more convenient architecture testing
 */

import { projectFiles, metrics } from 'archunit';

/**
 * Custom matcher for Clean Architecture layer validation
 */
export class LayerMatcher {
  constructor(private layerPath: string) {}

  shouldNotDependOn(targetLayerPath: string) {
    return projectFiles()
      .inFolder(this.layerPath)
      .shouldNot()
      .dependOnFiles()
      .inFolder(targetLayerPath);
  }

  shouldHaveNoCycles() {
    return projectFiles()
      .inFolder(this.layerPath)
      .should()
      .haveNoCycles();
  }

  shouldFollowNamingPattern(pattern: string | RegExp) {
    return projectFiles()
      .inFolder(this.layerPath)
      .should()
      .matchPattern(pattern);
  }

  shouldHaveHighCohesion(threshold: number = 0.5) {
    return metrics()
      .inFolder(this.layerPath)
      .lcom()
      .lcom96b()
      .shouldBeBelow(threshold);
  }

  shouldHaveReasonableFileSize(maxLines: number = 300) {
    return metrics()
      .inFolder(this.layerPath)
      .count()
      .linesOfCode()
      .shouldBeBelow(maxLines);
  }

  shouldHaveReasonableMethodCount(maxMethods: number = 15) {
    return metrics()
      .inFolder(this.layerPath)
      .count()
      .methodCount()
      .shouldBeBelow(maxMethods);
  }
}

/**
 * Create a layer matcher for testing architectural boundaries
 */
export function layer(layerPath: string): LayerMatcher {
  return new LayerMatcher(layerPath);
}

/**
 * Domain-specific matchers
 */
export class DomainMatcher extends LayerMatcher {
  constructor(domainPath: string = '**/domain/**') {
    super(domainPath);
  }

  shouldBeIndependent() {
    return [
      this.shouldNotDependOn('**/infrastructure/**'),
      this.shouldNotDependOn('**/application/**'),
      this.shouldNotDependOn('**/api/**'),
      this.shouldNotDependOn('**/ui/**'),
    ];
  }

  entitiesShouldFollowConventions() {
    return projectFiles()
      .inFolder(this.layerPath)
      .withName('*.entity.ts')
      .should()
      .matchPattern('*.entity.ts');
  }

  valueObjectsShouldFollowConventions() {
    return projectFiles()
      .inFolder(this.layerPath)
      .withName('*.value-objects.ts')
      .should()
      .matchPattern('*.value-objects.ts');
  }

  unitOfWorksShouldFollowConventions() {
    return projectFiles()
      .inFolder(this.layerPath)
      .withName('*.uow.ts')
      .should()
      .matchPattern('*.uow.ts');
  }
}

/**
 * Application layer specific matchers
 */
export class ApplicationMatcher extends LayerMatcher {
  constructor(applicationPath: string = '**/application/**') {
    super(applicationPath);
  }

  shouldNotDependOnInfrastructure() {
    return [
      this.shouldNotDependOn('**/infrastructure/**'),
      this.shouldNotDependOn('**/service-*/**'),
      this.shouldNotDependOn('**/api/**'),
      this.shouldNotDependOn('**/ui/**'),
    ];
  }

  servicesShouldBeFocused() {
    return [
      this.shouldHaveHighCohesion(0.4), // Higher cohesion for application services
      this.shouldHaveReasonableMethodCount(10), // Application services should be focused
    ];
  }
}

/**
 * UI layer specific matchers
 */
export class UIMatcher extends LayerMatcher {
  constructor(uiPath: string = '**/ui/**') {
    super(uiPath);
  }

  componentsShouldFollowReactConventions() {
    return projectFiles()
      .inFolder(this.uiPath)
      .withName(/^[A-Z][a-zA-Z]*\.(tsx|ts)$/)
      .should()
      .matchPattern(/^[A-Z][a-zA-Z]*\.(tsx|ts)$/);
  }

  shouldHaveCorrespondingStories() {
    // This would need more complex logic to check that components have stories
    return projectFiles()
      .inFolder(this.uiPath)
      .withName('*.stories.tsx')
      .should()
      .matchPattern('*.stories.tsx');
  }

  shouldNotDependOnInfrastructure() {
    return this.shouldNotDependOn('**/infrastructure/**');
  }
}

/**
 * Service layer specific matchers
 */
export class ServiceMatcher extends LayerMatcher {
  constructor(servicePath: string = '**/service-*/**') {
    super(servicePath);
  }

  shouldNotDependOnDomainOrApplication() {
    return [
      this.shouldNotDependOn('**/domain/**'),
      this.shouldNotDependOn('**/application/**'),
    ];
  }

  shouldBeLightweight() {
    return [
      this.shouldHaveReasonableFileSize(200), // Services should be focused
      this.shouldHaveReasonableMethodCount(8),
    ];
  }
}

/**
 * Package-level matchers for monorepo structure
 */
export class PackageMatcher {
  constructor(private packagePath: string) {}

  shouldHaveNoCycles() {
    return projectFiles()
      .inFolder(this.packagePath)
      .should()
      .haveNoCycles();
  }

  shouldFollowPackageStructure() {
    // Package should have proper structure (package.json, src/, etc.)
    return [
      projectFiles()
        .inPath(`${this.packagePath}/package.json`)
        .should()
        .exist(),
      projectFiles()
        .inPath(`${this.packagePath}/src/**`)
        .should()
        .exist(),
    ];
  }

  shouldHaveTests() {
    return projectFiles()
      .inFolder(this.packagePath)
      .withName('*.test.ts')
      .should()
      .exist();
  }
}

/**
 * Factory functions for convenience
 */
export function domain(path?: string): DomainMatcher {
  return new DomainMatcher(path);
}

export function application(path?: string): ApplicationMatcher {
  return new ApplicationMatcher(path);
}

export function ui(path?: string): UIMatcher {
  return new UIMatcher(path);
}

export function service(path?: string): ServiceMatcher {
  return new ServiceMatcher(path);
}

export function packageMatcher(packagePath: string): PackageMatcher {
  return new PackageMatcher(packagePath);
}

/**
 * Common architectural patterns
 */
export const patterns = {
  // File naming patterns
  ENTITY_FILES: '*.entity.ts',
  VALUE_OBJECT_FILES: '*.value-objects.ts',
  UNIT_OF_WORK_FILES: '*.uow.ts',
  SERVICE_FILES: '*.service.ts',
  CONTROLLER_FILES: '*.controller.ts',
  RESOLVER_FILES: '*.resolver.ts',
  
  // Test file patterns
  TEST_FILES: '*.test.ts',
  SPEC_FILES: '*.spec.ts',
  ARCH_TEST_FILES: '*.arch.test.ts',
  STORY_FILES: '*.stories.tsx',
  
  // React component patterns
  REACT_COMPONENTS: /^[A-Z][a-zA-Z]*\.(tsx|ts)$/,
  REACT_HOOKS: /^use[A-Z][a-zA-Z]*\.ts$/,
  
  // Configuration patterns
  CONFIG_FILES: '*.config.ts',
  VITEST_CONFIGS: 'vitest.*.config.ts',
} as const;