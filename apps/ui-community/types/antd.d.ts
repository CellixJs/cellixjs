/**
 * Type shim for antd to work around tsgo/TypeScript Native Preview compatibility issues.
 * This centralizes antd type imports to avoid scattered @ts-ignore comments.
 * 
 * See ADR-0023 for context on tsgo setup and temporary workarounds.
 * TODO: Remove when TypeScript 7.0 is officially released and antd types are compatible.
 */

declare module 'antd' {
	// @ts-ignore [TS7]
	export * from 'antd';
}

declare module 'antd/lib/theme/interface/index.js' {
	// @ts-ignore [TS7]
	export * from 'antd/lib/theme/interface/index.js';
}
