#!/usr/bin/env node

import { prepareCellixAzureFunctionsDeploy } from '../dist/index.js';

const args = process.argv.slice(2);
const appDir = readFlagValue(args, '--app-dir');
const deployDirName = readFlagValue(args, '--deploy-dir');
const bundleEntryRelativePath = readFlagValue(args, '--bundle-entry');
const hostJsonFilename = readFlagValue(args, '--host-json');

await prepareCellixAzureFunctionsDeploy({
	...(appDir ? { appDir } : {}),
	...(deployDirName ? { deployDirName } : {}),
	...(bundleEntryRelativePath ? { bundleEntryRelativePath } : {}),
	...(hostJsonFilename ? { hostJsonFilename } : {}),
});

function readFlagValue(argsList, flag) {
	const index = argsList.indexOf(flag);
	if (index === -1) {
		return undefined;
	}

	return argsList[index + 1];
}
