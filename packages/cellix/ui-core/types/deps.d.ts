/**
 * Type shims for UI dependencies to work around tsgo/TypeScript Native Preview compatibility issues.
 * This centralizes type imports to avoid scattered @ts-ignore comments.
 * 
 * See ADR-0023 for context on tsgo setup and temporary workarounds.
 * TODO: Remove when TypeScript 7.0 is officially released and dependency types are compatible.
 */

declare module 'antd' {
	// @ts-ignore [TS7]
	export * from 'antd';
}

declare module 'react' {
	// @ts-ignore [TS7]
	export * from 'react';
}
