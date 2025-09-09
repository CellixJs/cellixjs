/**
 * Custom ArchUnit Matchers for CellixJS
 *
 * Provides convenient matchers for common architectural patterns
 */
/**
 * Helper to create clean architecture dependency rules
 */
export declare function createCleanArchitectureRule(sourceFolder: string, targetFolder: string): import("archunit").DependOnFileCondition;
/**
 * Helper to create cycle detection rules
 */
export declare function createNoCycleRule(folderPattern: string): import("archunit").CycleFreeFileCondition;
