/**
 * Central loader for step definitions.
 * Cucumber imports this file, which then loads all context-specific step definitions.
 */

import '../shared/support/ui/setup-jsdom.ts';
import '../shared/support/hooks.ts';
import '../contexts/community/step-definitions/index.ts';
