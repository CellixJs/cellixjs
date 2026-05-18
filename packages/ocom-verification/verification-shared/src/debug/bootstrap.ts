/**
 * Debug bootstrap — load this at the top of cucumber.js `import` files to get
 * loud, unmistakable diagnostic output when something crashes before any
 * scenario can run. Strip this file once the CI failure mode is understood.
 */

const tag = process.env.DEBUG_TAG ?? 'debug';

function log(message: string): void {
	// Use stdout directly so turbo prefixes the line with the package name.
	process.stdout.write(`[${tag}] ${message}\n`);
}

log(`bootstrap loaded — node=${process.version} platform=${process.platform} cwd=${process.cwd()}`);
log(`argv=${JSON.stringify(process.argv)}`);
log(`env.CI=${process.env.CI ?? '(unset)'} env.TF_BUILD=${process.env.TF_BUILD ?? '(unset)'}`);

process.on('unhandledRejection', (reason) => {
	const err = reason instanceof Error ? `${reason.stack ?? reason.message}` : String(reason);
	log(`UNHANDLED REJECTION:\n${err}`);
});

process.on('uncaughtException', (err) => {
	log(`UNCAUGHT EXCEPTION:\n${err.stack ?? err.message}`);
});

process.on('beforeExit', (code) => {
	log(`beforeExit code=${code}`);
});

process.on('exit', (code) => {
	process.stdout.write(`[${tag}] process.exit code=${code}\n`);
});
