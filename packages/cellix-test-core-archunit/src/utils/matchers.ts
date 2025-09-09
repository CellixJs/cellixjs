/**
 * Custom ArchUnit Matchers for CellixJS
 * 
 * Provides convenient matchers for common architectural patterns
 */

import { projectFiles } from 'archunit';

/**
 * Helper to create clean architecture dependency rules
 */
export function createCleanArchitectureRule(sourceFolder: string, targetFolder: string) {
  return projectFiles()
    .inFolder(sourceFolder)
    .shouldNot()
    .dependOnFiles()
    .inFolder(targetFolder);
}

/**
 * Helper to create cycle detection rules
 */
export function createNoCycleRule(folderPattern: string) {
  return projectFiles()
    .inFolder(folderPattern)
    .should()
    .haveNoCycles();
}