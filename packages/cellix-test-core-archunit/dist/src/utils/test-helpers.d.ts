/**
 * Architecture Test Helper Functions for CellixJS
 *
 * Shared utilities to make architecture testing more convenient and consistent
 */
/**
 * Options for architecture test execution
 */
export interface ArchTestOptions {
    /** Enable debug logging */
    enableLogging?: boolean;
    /** Allow tests that don't find any files to check */
    allowEmptyTests?: boolean;
}
/**
 * Default options for architecture tests
 */
export declare const defaultArchTestOptions: ArchTestOptions;
/**
 * Execute an architecture rule with consistent options and error checking
 */
export declare function executeArchRule(rule: any, options?: ArchTestOptions): Promise<void>;
/**
 * Execute multiple architecture rules with consistent error reporting
 */
export declare function executeArchRules(rules: (() => any)[], options?: ArchTestOptions): Promise<void>;
/**
 * Helper to get package path for workspace packages
 */
export declare function getPackagePath(packageName: string): string;
/**
 * Common package names used in CellixJS
 */
export declare const PACKAGE_NAMES: {
    readonly API_DOMAIN: "api-domain";
    readonly CELLIX_DOMAIN_SEEDWORK: "cellix-domain-seedwork";
    readonly API_APPLICATION_SERVICES: "api-application-services";
    readonly CELLIX_API_SERVICES_SPEC: "cellix-api-services-spec";
    readonly SERVICE_MONGOOSE: "service-mongoose";
    readonly SERVICE_OTEL: "service-otel";
    readonly SERVICE_BLOB_STORAGE: "service-blob-storage";
    readonly API: "api";
    readonly API_GRAPHQL: "api-graphql";
    readonly API_REST: "api-rest";
    readonly UI_COMPONENTS: "ui-components";
    readonly UI_COMMUNITY: "ui-community";
    readonly CELLIX_UI_CORE: "cellix-ui-core";
};
