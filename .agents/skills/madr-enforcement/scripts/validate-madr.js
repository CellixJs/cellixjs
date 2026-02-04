#!/usr/bin/env node

/**
 * MADR Validation Script
 * 
 * Validates MADR files for compliance with CellixJS conventions.
 * 
 * Usage:
 *   node validate-madr.js <path-to-madr-file>
 *   node validate-madr.js apps/docs/docs/decisions/0024-example.md
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

class MADRValidator {
  constructor(filePath) {
    this.filePath = filePath;
    this.errors = [];
    this.warnings = [];
    this.content = '';
    this.frontmatter = {};
  }

  validate() {
    console.log(`${colors.blue}Validating MADR: ${this.filePath}${colors.reset}\n`);

    if (!this.readFile()) {
      return false;
    }

    this.validateFilename();
    this.validateFrontmatter();
    this.validateStructure();
    this.validateContent();

    this.printResults();
    return this.errors.length === 0;
  }

  readFile() {
    try {
      this.content = fs.readFileSync(this.filePath, 'utf8');
      return true;
    } catch (error) {
      this.errors.push(`Cannot read file: ${error.message}`);
      return false;
    }
  }

  validateFilename() {
    const filename = path.basename(this.filePath);
    
    // Check format: NNNN-title-with-dashes.md
    const filenamePattern = /^\d{4}-[a-z0-9-]+\.md$/;
    if (!filenamePattern.test(filename)) {
      this.errors.push(
        `Filename must match pattern NNNN-title-with-dashes.md (e.g., 0024-example-decision.md)`
      );
    }

    // Check if number is sequential (warning only)
    const match = filename.match(/^(\d{4})-/);
    if (match) {
      const number = parseInt(match[1], 10);
      if (number === 0) {
        this.warnings.push('MADR number 0000 is reserved. Start from 0001.');
      }
    }
  }

  validateFrontmatter() {
    // Extract frontmatter
    const frontmatterMatch = this.content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      this.errors.push('Missing YAML frontmatter (must start with --- and end with ---)');
      return;
    }

    const frontmatterText = frontmatterMatch[1];
    
    // Parse frontmatter (simple key: value parsing)
    const lines = frontmatterText.split('\n');
    lines.forEach(line => {
      const match = line.match(/^([^:]+):\s*(.*)$/);
      if (match) {
        this.frontmatter[match[1].trim()] = match[2].trim();
      }
    });

    // Required fields
    const requiredFields = ['status', 'date'];
    requiredFields.forEach(field => {
      if (!this.frontmatter[field]) {
        this.errors.push(`Missing required frontmatter field: ${field}`);
      }
    });

    // Validate status
    const validStatuses = ['proposed', 'rejected', 'accepted', 'deprecated'];
    const status = this.frontmatter.status;
    if (status && !validStatuses.includes(status) && !status.startsWith('superseded by')) {
      this.errors.push(
        `Invalid status: "${status}". Must be one of: ${validStatuses.join(', ')} or "superseded by [ADR-NNNN]"`
      );
    }

    // Validate date format
    const date = this.frontmatter.date;
    if (date && !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      this.errors.push(`Invalid date format: "${date}". Must be YYYY-MM-DD`);
    }

    // Check for recommended fields
    const recommendedFields = ['sidebar_position', 'sidebar_label', 'description', 'deciders'];
    recommendedFields.forEach(field => {
      if (!this.frontmatter[field]) {
        this.warnings.push(`Missing recommended frontmatter field: ${field}`);
      }
    });

    // Validate deciders include EM and patrick (warning)
    const deciders = this.frontmatter.deciders;
    if (deciders) {
      if (!deciders.includes('patrick')) {
        this.warnings.push('Deciders or informed should include "patrick" per ADR-0001');
      }
    }
  }

  validateStructure() {
    const requiredSections = [
      'Context and Problem Statement',
      'Decision Drivers',
      'Considered Options',
      'Decision Outcome',
      'Pros and Cons of the Options'
    ];

    requiredSections.forEach(section => {
      const sectionPattern = new RegExp(`^##\\s+${section}`, 'm');
      if (!sectionPattern.test(this.content)) {
        this.errors.push(`Missing required section: "${section}"`);
      }
    });

    // Check for title (H1)
    if (!this.content.match(/^#\s+[^\n]+/m)) {
      this.errors.push('Missing H1 title');
    }
  }

  validateContent() {
    // Check for multiple options
    const optionsSection = this.content.match(/## Considered Options\n([\s\S]*?)(?=\n##|$)/);
    if (optionsSection) {
      const options = optionsSection[1].match(/^[-*]\s+/gm);
      if (!options || options.length < 2) {
        this.warnings.push(
          'Consider documenting at least 2 options (including status quo or "do nothing")'
        );
      }
    }

    // Check for validation section (recommended)
    if (!this.content.match(/##\s+Validation/m)) {
      this.warnings.push('Consider adding a "Validation" section with acceptance criteria');
    }

    // Check for references to other ADRs
    const adrReferences = this.content.match(/ADR-\d{4}/g);
    if (adrReferences && adrReferences.length > 0) {
      console.log(`${colors.blue}ℹ References ${adrReferences.length} other ADR(s)${colors.reset}`);
    }
  }

  printResults() {
    console.log('');

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log(`${colors.green}✓ MADR validation passed!${colors.reset}\n`);
      return;
    }

    if (this.errors.length > 0) {
      console.log(`${colors.red}✗ Errors (${this.errors.length}):${colors.reset}`);
      this.errors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error}`);
      });
      console.log('');
    }

    if (this.warnings.length > 0) {
      console.log(`${colors.yellow}⚠ Warnings (${this.warnings.length}):${colors.reset}`);
      this.warnings.forEach((warning, i) => {
        console.log(`  ${i + 1}. ${warning}`);
      });
      console.log('');
    }

    if (this.errors.length === 0) {
      console.log(`${colors.green}✓ MADR validation passed with warnings${colors.reset}\n`);
    } else {
      console.log(`${colors.red}✗ MADR validation failed${colors.reset}\n`);
    }
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error(`${colors.red}Error: Please provide path to MADR file${colors.reset}`);
    console.log('\nUsage:');
    console.log('  node validate-madr.js <path-to-madr-file>');
    console.log('\nExample:');
    console.log('  node validate-madr.js apps/docs/docs/decisions/0024-example.md');
    process.exit(1);
  }

  const validator = new MADRValidator(args[0]);
  const isValid = validator.validate();
  
  process.exit(isValid ? 0 : 1);
}

module.exports = MADRValidator;
