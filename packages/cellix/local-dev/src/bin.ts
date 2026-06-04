import { runCli } from './cli.ts';

const exitCode = runCli(process.argv.slice(2));

if (typeof exitCode === 'number' && exitCode !== 0) {
	process.exit(exitCode);
}
