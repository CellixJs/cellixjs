export interface CodeMetricsConfig {
	tsconfigPath?: string;
	sourcePaths?: string[];
	maxLinesOfCode?: number;
	maxStatements?: number;
	maxMethods?: number;
	maxFields?: number;
	maxImports?: number;
}

export function checkCodeMetrics(_config: CodeMetricsConfig): string[] {
	return [];
}
