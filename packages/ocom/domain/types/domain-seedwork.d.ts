/**
 * Type shim for @cellix/domain-seedwork to work around tsgo/TypeScript Native Preview compatibility issues.
 * This centralizes domain-seedwork type imports to avoid scattered @ts-ignore comments.
 * 
 * See ADR-0023 for context on tsgo setup and temporary workarounds.
 * TODO: Remove when TypeScript 7.0 is officially released and type compatibility is improved.
 */

declare module '@cellix/domain-seedwork/value-object' {
	// @ts-ignore [TS7]
	export * from '@cellix/domain-seedwork/value-object';
}
