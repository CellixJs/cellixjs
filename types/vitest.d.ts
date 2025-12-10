/**
 * Type shim for vitest to work around tsgo/TypeScript Native Preview compatibility issues.
 * This centralizes vitest type imports to avoid scattered @ts-ignore comments.
 * 
 * See ADR-0023 for context on tsgo setup and temporary workarounds.
 * TODO: Remove when TypeScript 7.0 is officially released and vitest types are compatible.
 */

declare module 'vitest/config' {
	// @ts-ignore [TS7]
	export * from 'vitest/config';
}
