This package expects Node.js v22.22.2 (managed via the repository's mise.toml).
If mise is not installed, install it and activate it (see https://mise.jdx.dev/getting-started.html):

curl -fsSL https://get.mise.dev | sh
# See apps/docs/docs/setup.md for the canonical developer setup instructions
# Restart your shell or activate mise for your shell (e.g. eval "$(~/.local/bin/mise activate zsh)")

# Then install project tools and the Node version configured in the workspace:
mise install





npm install -D @types/node -w api

npm install -D eslint @eslint/js typescript-eslint -w @apps/api

npm install @azure/identity -w api

npm install @as-integrations/azure-functions -api

needed "skipLibCheck": true in tsconfig.json to build mongoose



Following Standards:

TypeScript Style: 
[Google's Style Guide](https://github.com/google/styleguide?tab=readme-ov-file#google-style-guides)



host.json settings

* telemetryMode: OpenTelemetry
  * this project is set up for OpenTelemetry
