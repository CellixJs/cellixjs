module.exports = {
	// Enable Turborepo delegation in Portless. When true, Portless will delegate
	// long-running workspace commands (like `dev`) to Turbo where appropriate.
	// This keeps the monorepo task graph and dependency ordering defined by
	// turbo.json while still allowing Portless to manage public HTTPS routes.
	turbo: true,
	// You can add additional Portless configuration options here if needed.
};
