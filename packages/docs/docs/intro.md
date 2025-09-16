---
sidebar_position: 1
---

# Introduction 👋

Let's discover **CellixJs in less than 5 minutes**.

## Getting Started

Get started by **exploring the CellixJs platform**.

CellixJs is a Domain-Driven Design (DDD) monorepo built on Azure Functions, implementing a modular architecture with strict separation of concerns.

### What you'll need

- [Node.js](https://nodejs.org/en/download/) version 22.0 or above:
  - When installing Node.js, you are recommended to check all checkboxes related to dependencies.
- [Azure Functions Core Tools](https://docs.microsoft.com/en-us/azure/azure-functions/functions-run-local) for local development

    * `func --version`
        * should return 4.0.6610 or greater
    * [Install Guide](https://github.com/Azure/azure-functions-core-tools#installing)
        * to upgrade: (mac)
        * `brew upgrade azure-functions-core-tools@4`

- [MongoDB](https://www.mongodb.com/try/download/community) or access to a MongoDB instance

## Clone and Setup

Clone the CellixJs repository and set up the development environment:

```bash
git clone https://github.com/CellixJs/cellixjs.git
cd cellixjs
```



Install dependencies and build the project: (we recommend using NVM)

```bash
# Install Node.js v22
nvm install v22

# Install Latest NPM (v11+)
nvm install-latest-npm

# Use Node.js v22
nvm use v22

# Clean, install dependencies, and build
npm run clean
npm install 
npm run build
```

## Install VSCode plugins
You will be prompted to install the [recommended VSCode Plugins](https://github.com/CellixJs/cellixjs/blob/main/.vscode/extensions.json) upon opening the project in VSCode. Go ahead and do so.

## Start Development

Run the development environment:

```bash
npm run dev
```

This command will:
- Build all workspace packages
- Start mock emulator services (Azurite for Azure Storage)
- Launch the backend Azure Functions runtime
- Start the frontend React UI

The development server will be available at:
- **API**: http://localhost:7071 (Azure Functions)
- **GraphQL Playground**: http://localhost:7071/api/graphql
- **Frontend**: http://localhost:3000 (if using the UI packages)

## Architecture Overview

CellixJs follows these core patterns:

- **Domain Layer**: Core business logic in `packages/api-domain/src/domain/contexts/`
- **Application Services**: Orchestration layer for business operations
- **Infrastructure**: Data persistence via Mongoose, OpenTelemetry observability  
- **API Layer**: GraphQL and REST endpoints via Azure Functions

Open any file in the `packages/` directory and start exploring: the project uses hot reloading for rapid development!
