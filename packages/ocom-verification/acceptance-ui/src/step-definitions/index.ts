/**
 * Central loader for step definitions.
 * Cucumber imports this file, which then loads all context-specific step definitions.
 */

import '@cellix/serenity-framework/jsdom/setup';
import '../shared/cucumber-lifecycle-hooks.ts';
import '../contexts/community/step-definitions/index.ts';
import '../contexts/authentication/step-definitions/index.ts';
