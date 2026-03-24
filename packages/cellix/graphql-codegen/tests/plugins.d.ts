declare module '*.mjs' {
	export const plugin: (
		schema: unknown,
		documents: unknown[],
		config: Record<string, unknown>,
		info?: { outputFile?: string } | undefined,
	) => Promise<string>;
}
