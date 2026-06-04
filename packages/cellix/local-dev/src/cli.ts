import { syncApiLocalSettings } from './api-local-settings.ts';
import { runAzureFunctionsDev, runAzuriteDev, runDocusaurusDev, runTsxDev, runViteDev, type TsxDevProfile, type ViteDevProfile } from './runners.ts';

type CliCommand = 'vite' | 'docusaurus' | 'azure-functions' | 'tsx' | 'azurite' | 'sync-api-local-settings';

type FlagMap = Record<string, string>;

function parseFlags(args: string[]): { flags: FlagMap; positionals: string[] } {
	const flags: FlagMap = {};
	const positionals: string[] = [];

	for (let index = 0; index < args.length; index += 1) {
		const arg = args[index];
		if (!arg) {
			continue;
		}
		if (arg === '--help' || arg === '-h') {
			flags['help'] = 'true';
			continue;
		}

		if (arg.startsWith('--')) {
			const key = arg.slice(2);
			const value = args[index + 1];
			if (!value || value.startsWith('--')) {
				throw new Error(`[local-dev] Missing value for --${key}`);
			}
			flags[key] = value;
			index += 1;
			continue;
		}

		positionals.push(arg);
	}

	return { flags, positionals };
}

function usage(): string {
	return [
		'Usage:',
		'  cellix-local-dev vite --profile <ui-community|ui-staff>',
		'  cellix-local-dev docusaurus',
		'  cellix-local-dev azure-functions',
		'  cellix-local-dev tsx --profile <oauth2-mock|mongo-memory-mock> [--entry src/index.ts]',
		'  cellix-local-dev azurite',
		'  cellix-local-dev sync-api-local-settings [e2e]',
	].join('\n');
}

function asViteProfile(value: string | undefined): ViteDevProfile {
	if (value === 'ui-community' || value === 'ui-staff') {
		return value;
	}
	throw new Error(`[local-dev] Invalid vite profile "${value ?? ''}"`);
}

function asTsxProfile(value: string | undefined): TsxDevProfile {
	if (value === 'oauth2-mock' || value === 'mongo-memory-mock') {
		return value;
	}
	throw new Error(`[local-dev] Invalid tsx profile "${value ?? ''}"`);
}

/**
 * Runs the `cellix-local-dev` CLI.
 */
export function runCli(argv = process.argv.slice(2)): number {
	const [command, ...rest] = argv as [CliCommand | undefined, ...string[]];

	if (!command) {
		console.error(usage());
		return 1;
	}

	try {
		const { flags, positionals } = parseFlags(rest);
		if (flags['help'] === 'true') {
			console.log(usage());
			return 0;
		}

		switch (command) {
			case 'vite':
				runViteDev(asViteProfile(flags['profile']));
				return 0;
			case 'docusaurus':
				runDocusaurusDev();
				return 0;
			case 'azure-functions':
				runAzureFunctionsDev();
				return 0;
			case 'tsx':
				runTsxDev(asTsxProfile(flags['profile']), {
					...(flags['entry'] ? { entry: flags['entry'] } : {}),
				});
				return 0;
			case 'azurite':
				runAzuriteDev();
				return 0;
			case 'sync-api-local-settings':
				if (positionals[0] && positionals[0] !== 'e2e') {
					throw new Error(`[local-dev] Invalid sync-api-local-settings mode "${positionals[0]}"`);
				}
				syncApiLocalSettings(
					positionals[0] === 'e2e'
						? {
								mode: 'e2e',
							}
						: {},
				);
				return 0;
			default:
				console.error(usage());
				return 1;
		}
	} catch (error) {
		console.error(error instanceof Error ? error.message : String(error));
		return 1;
	}
}
