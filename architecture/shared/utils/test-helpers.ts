/**
 * Architecture Test Helper Functions for CellixJS
 * 
 * Shared utilities to make architecture testing more convenient and consistent
 */

import { expect } from 'vitest';
import { extendVitestMatchers } from 'archunit';

// Extend Vitest with ArchUnit matchers
extendVitestMatchers(expect);

/**
 * Options for architecture test execution
 */
export interface ArchTestOptions {
  /** Enable debug logging */
  enableLogging?: boolean;
  /** Log level for debugging */
  logLevel?: 'error' | 'warn' | 'info' | 'debug';
  /** Allow tests that don't find any files to check */
  allowEmptyTests?: boolean;
  /** Clear cache before running */
  clearCache?: boolean;
}

/**
 * Default options for architecture tests
 */
export const defaultArchTestOptions: ArchTestOptions = {
  enableLogging: false,
  logLevel: 'info',
  allowEmptyTests: false,
  clearCache: false,
};

/**
 * Execute an architecture rule with consistent options
 */
export async function executeArchRule(
  rule: any,
  options: ArchTestOptions = {}
): Promise<void> {
  const testOptions = { ...defaultArchTestOptions, ...options };
  
  const archUnitOptions = {
    logging: testOptions.enableLogging ? {
      enabled: true,
      level: testOptions.logLevel,
    } : undefined,
    allowEmptyTests: testOptions.allowEmptyTests,
    clearCache: testOptions.clearCache,
  };

  await expect(rule).toPassAsync(archUnitOptions);
}

/**
 * Execute multiple architecture rules with consistent error reporting
 */
export async function executeArchRules(
  rules: (() => any)[],
  options: ArchTestOptions = {}
): Promise<void> {
  for (const ruleFactory of rules) {
    const rule = ruleFactory();
    await executeArchRule(rule, options);
  }
}

/**
 * Create a test suite for a specific package
 */
export function createPackageArchitectureTests(
  packageName: string,
  packagePath: string,
  rules: (() => any)[],
  options: ArchTestOptions = {}
) {
  return {
    packageName,
    packagePath,
    async runTests() {
      await executeArchRules(rules, options);
    }
  };
}

/**
 * Helper to get package path for workspace packages
 */
export function getPackagePath(packageName: string): string {
  return `packages/${packageName}`;
}

/**
 * Helper to create domain-specific test path
 */
export function getDomainPath(packageName: string): string {
  return `${getPackagePath(packageName)}/src/domain`;
}

/**
 * Helper to create application services test path
 */
export function getApplicationPath(packageName: string): string {
  return `${getPackagePath(packageName)}/src/application`;
}

/**
 * Helper to create UI components test path
 */
export function getUIPath(packageName: string): string {
  return `${getPackagePath(packageName)}/src/components`;
}

/**
 * Common package names used in CellixJS
 */
export const PACKAGE_NAMES = {
  // Domain packages
  API_DOMAIN: 'api-domain',
  CELLIX_DOMAIN_SEEDWORK: 'cellix-domain-seedwork',
  
  // Application packages
  API_APPLICATION_SERVICES: 'api-application-services',
  CELLIX_API_SERVICES_SPEC: 'cellix-api-services-spec',
  
  // Infrastructure packages
  SERVICE_MONGOOSE: 'service-mongoose',
  SERVICE_OTEL: 'service-otel',
  SERVICE_BLOB_STORAGE: 'service-blob-storage',
  
  // API packages
  API: 'api',
  API_GRAPHQL: 'api-graphql',
  API_REST: 'api-rest',
  
  // UI packages
  UI_COMPONENTS: 'ui-components',
  UI_COMMUNITY: 'ui-community',
  CELLIX_UI_CORE: 'cellix-ui-core',
} as const;

/**
 * Helper function to determine if debug logging should be enabled
 * based on environment variables or test context
 */
export function shouldEnableDebugLogging(): boolean {
  return process.env.ARCH_DEBUG === 'true' || process.env.NODE_ENV === 'test';
}

/**
 * Log architecture test results for CI/CD integration
 */
export function logArchTestResult(
  testName: string,
  passed: boolean,
  duration: number,
  details?: string
): void {
  const status = passed ? 'PASSED' : 'FAILED';
  const timestamp = new Date().toISOString();
  
  console.log(`[${timestamp}] ARCH_TEST ${status}: ${testName} (${duration}ms)`);
  
  if (details) {
    console.log(`[${timestamp}] ARCH_TEST DETAILS: ${details}`);
  }
}