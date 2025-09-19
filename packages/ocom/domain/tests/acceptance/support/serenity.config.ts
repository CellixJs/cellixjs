import { AfterAll, Before, BeforeAll } from '@cucumber/cucumber';
import { configure, Duration } from '@serenity-js/core';
import { SerenityBDDReporter } from '@serenity-js/serenity-bdd';
import { ConsoleReporter } from '@serenity-js/console-reporter';
import { resolve } from 'node:path';
import { mkdirSync } from 'node:fs';
import { CommunityCreationResults } from '../screenplay/interactions/create-community.js';

/**
 * Serenity/JS configuration for BDD tests
 * Configures reporting, timeouts, and crew members
 */

BeforeAll(async function() {
  // Ensure target directory exists for Serenity BDD reports
  const outputDir = resolve(process.cwd(), 'target/site/serenity');
  mkdirSync(outputDir, { recursive: true });
  
  // Configure Serenity/JS with reporters and settings
  configure({
    crew: [
      // Console reporter for immediate feedback during test runs
      ConsoleReporter.fromJSON({
        theme: 'auto',
      }),
      
      // Serenity BDD reporter - this will write JSON files for the CLI to process
      SerenityBDDReporter.fromJSON({}),
    ],

    // Global timeout settings
    cueTimeout: Duration.ofSeconds(5),
    
    // Test execution settings
    interactionTimeout: Duration.ofSeconds(10),
  });

  console.log('🎭 Serenity/JS configured for Community Management BDD tests');
  console.log('📊 Reports will be generated in: target/serenity-reports');
});

Before(function(scenario) {
  // Clean up any previous test state
  CommunityCreationResults.createdCommunity = null;
  CommunityCreationResults.creationError = null;
  
  // Log scenario information for better traceability
  console.log(`🎬 Starting scenario: ${scenario.pickle.name}`);
  if (scenario.pickle.tags.length > 0) {
    const tags = scenario.pickle.tags.map(tag => tag.name).join(', ');
    console.log(`🏷️  Tags: ${tags}`);
  }
});

AfterAll(async function() {
  console.log('🎭 Serenity/JS test execution completed');
  console.log('📈 Check target/serenity-reports for detailed test reports');
});