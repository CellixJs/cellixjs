/**
 * Architecture Test Helper Functions for CellixJS
 *
 * Shared utilities to make architecture testing more convenient and consistent
 */
import { expect } from 'vitest';
/**
 * Default options for architecture tests
 */
export const defaultArchTestOptions = {
    enableLogging: false,
    allowEmptyTests: true,
};
/**
 * Execute an architecture rule with consistent options and error checking
 */
export async function executeArchRule(rule, options = {}) {
    const testOptions = { ...defaultArchTestOptions, ...options };
    const violations = await rule.check(testOptions);
    if (testOptions.enableLogging && violations.length > 0) {
        console.log('Architecture violations found:');
        violations.forEach((violation, index) => {
            console.log(`${index + 1}. ${violation.toString()}`);
        });
    }
    expect(violations).toHaveLength(0);
}
/**
 * Execute multiple architecture rules with consistent error reporting
 */
export async function executeArchRules(rules, options = {}) {
    for (const ruleFactory of rules) {
        const rule = ruleFactory();
        await executeArchRule(rule, options);
    }
}
/**
 * Helper to get package path for workspace packages
 */
export function getPackagePath(packageName) {
    return `packages/${packageName}`;
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
};
//# sourceMappingURL=test-helpers.js.map