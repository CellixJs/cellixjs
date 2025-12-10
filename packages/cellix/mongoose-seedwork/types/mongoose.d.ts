/**
 * Type shim for mongoose to work around tsgo/TypeScript Native Preview compatibility issues.
 * This centralizes mongoose type imports to avoid scattered @ts-ignore comments.
 * 
 * See ADR-0023 for context on tsgo setup and temporary workarounds.
 * TODO: Remove when TypeScript 7.0 is officially released and mongoose types are compatible.
 */

declare module 'mongoose' {
	// Re-export all mongoose types
	// @ts-ignore [TS7]
	export * from 'mongoose';
}
