/**
 * Custom ArchUnit Matchers for CellixJS
 *
 * Provides convenient matchers for common architectural patterns
 */
import { projectFiles } from 'archunit';
/**
 * Helper to create clean architecture dependency rules
 */
export function createCleanArchitectureRule(sourceFolder, targetFolder) {
    return projectFiles()
        .inFolder(sourceFolder)
        .shouldNot()
        .dependOnFiles()
        .inFolder(targetFolder);
}
/**
 * Helper to create cycle detection rules
 */
export function createNoCycleRule(folderPattern) {
    return projectFiles()
        .inFolder(folderPattern)
        .should()
        .haveNoCycles();
}
//# sourceMappingURL=matchers.js.map