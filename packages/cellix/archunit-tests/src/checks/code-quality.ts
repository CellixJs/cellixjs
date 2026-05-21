export interface CodeQualityConfig {
	tsconfigPath?: string;
	domainPaths?: string[];
	uiPaths?: string[];
	servicePaths?: string[];
}

export function checkCodeQuality(_config: CodeQualityConfig): string[] {
	return [];
}
