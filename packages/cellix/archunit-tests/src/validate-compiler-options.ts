import ts from 'typescript';

export type TsConfig = {
	extends?: string;
	compilerOptions?: {
		outDir?: string;
		tsBuildInfoFile?: string;
		rootDir?: string;
		types?: string[];
		baseUrl?: string;
		ignoreDeprecations?: unknown;
	};
};

export function readTsConfig(filePath: string): Promise<TsConfig | null> {
	const result = ts.readConfigFile(filePath, ts.sys.readFile);
	if (result.error) {
		return Promise.resolve(null);
	}

	return Promise.resolve(result.config as TsConfig);
}

export function validateCommonCompilerOptions(tsconfigPath: string, config: TsConfig, violations: string[]): void {
	const compilerOptions = config.compilerOptions ?? {};

	if ('baseUrl' in compilerOptions) {
		violations.push(`${tsconfigPath}: compilerOptions.baseUrl must not be set`);
	}

	if ('ignoreDeprecations' in compilerOptions) {
		violations.push(`${tsconfigPath}: compilerOptions.ignoreDeprecations must not be set`);
	}

	// Default types are centralized in @cellix/config-typescript (tsconfig.node.json → ["node"],
	// tsconfig.vitest.json → ["vitest/globals","node"]). Packages inherit without repeating.
	// Guard: if types IS explicitly overridden here, it must not be empty — TS 7.0 defaults to []
	// which silently disables all ambient types when set explicitly.
	if (Array.isArray(compilerOptions.types) && compilerOptions.types.length === 0) {
		violations.push(`${tsconfigPath}: compilerOptions.types must not be empty (TS 7.0 defaults to [] — an empty array disables all ambient types)`);
	}

	const outDir = compilerOptions.outDir;
	const rootDir = compilerOptions.rootDir;

	if (outDir !== 'dist' && outDir !== './dist') {
		violations.push(`${tsconfigPath}: compilerOptions.outDir must be "dist" or "./dist"`);
	}

	if (rootDir !== 'src') {
		violations.push(`${tsconfigPath}: compilerOptions.rootDir must be "src"`);
	}
}

export function validateNodeCompilerOptions(tsconfigPath: string, config: TsConfig, violations: string[]): void {
	validateCommonCompilerOptions(tsconfigPath, config, violations);

	const tsBuildInfoFile = config.compilerOptions?.tsBuildInfoFile;
	if (tsBuildInfoFile !== 'dist/tsconfig.tsbuildinfo') {
		violations.push(`${tsconfigPath}: compilerOptions.tsBuildInfoFile must be "dist/tsconfig.tsbuildinfo"`);
	}
}
