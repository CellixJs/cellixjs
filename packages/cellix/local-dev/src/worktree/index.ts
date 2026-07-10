export { convertSettingsForWorktree, type WorktreeConversionPlan } from './conversion.ts';
export {
	type AzuritePorts,
	buildAzuriteConnectionString,
	getAzuritePorts,
	getMongoPort,
	getWorktreePortOffset,
} from './ports.ts';
export { WorktreeSettings } from './settings.ts';
export type { SettingsRecord, WorktreeMode, WorktreeSettingsOptions } from './types.ts';
