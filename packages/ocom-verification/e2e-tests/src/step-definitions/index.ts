/**
 * Central loader for step definitions.
 * Cucumber imports this file, which then loads all context-specific step definitions.
 */

import '../shared/support/hooks.ts';
import '../contexts/community/step-definitions/index.ts';
