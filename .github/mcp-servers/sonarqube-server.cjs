#!/usr/bin/env node

/**
 * SonarQube MCP Server for GitHub Copilot
 * 
 * Provides read-only access to SonarCloud analysis data for Pull Requests
 * Enables the copilot agent to understand and resolve code quality issues
 */

const https = require('node:https');
const fs = require('node:fs');
const path = require('node:path');

class SonarQubeMCPServer {
  constructor() {
    this.sonarToken = process.env.SONAR_TOKEN;
    this.serverUrl = process.env.SONAR_SERVER_URL || 'https://sonarcloud.io';
    this.organization = process.env.SONAR_ORGANIZATION || 'simnova';
    this.projectKey = process.env.SONAR_PROJECT_KEY || 'simnova_cellix-data-access';
    this.prContext = process.env.PR_CONTEXT === 'true';
    this.prNumber = process.env.PR_NUMBER;

    if (!this.sonarToken) {
      throw new Error('SONAR_TOKEN environment variable is required');
    }
  }

  /**
   * Make authenticated API request to SonarCloud
   */
  sonarApiRequest(endpoint) {
    return new Promise((resolve, reject) => {
      const url = new URL(this.serverUrl);
      const options = {
        hostname: url.hostname,
        path: `/api/${endpoint}`,
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.sonarToken}:`).toString('base64')}`
        }
      };

      const req = https.request(options, res => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(response);
            } else {
              reject(new Error(`SonarCloud API error: ${res.statusCode} - ${response.errors ? response.errors.map(e => e.msg).join(', ') : data}`));
            }
          } catch (error) {
            reject(new Error(`Invalid JSON response from SonarCloud: ${error.message}`));
          }
        });
      });

      req.on('error', error => reject(error));
      req.end();
    });
  }

  /**
   * Get project quality gate status
   */
  async getQualityGateStatus() {
    try {
      const response = await this.sonarApiRequest(`qualitygates/project_status?projectKey=${this.projectKey}`);
      return {
        status: response.projectStatus?.status || 'UNKNOWN',
        conditions: response.projectStatus?.conditions || [],
        ignoredConditions: response.projectStatus?.ignoredConditions || []
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Get issues for the project (or PR if in PR context)
   */
  async getProjectIssues(severity = null, type = null) {
    try {
      let endpoint = `issues/search?componentKeys=${this.projectKey}&s=FILE_LINE&resolved=false`;
      
      if (severity) {
        endpoint += `&severities=${severity}`;
      }
      
      if (type) {
        endpoint += `&types=${type}`;
      }

      // If in PR context and we have a report-task.txt, use it for PR-specific analysis
      if (this.prContext && this.prNumber) {
        endpoint += `&pullRequest=${this.prNumber}`;
      }

      const response = await this.sonarApiRequest(endpoint);
      
      return {
        total: response.total || 0,
        issues: (response.issues || []).map(issue => ({
          key: issue.key,
          rule: issue.rule,
          severity: issue.severity,
          component: issue.component,
          line: issue.line,
          message: issue.message,
          type: issue.type,
          status: issue.status,
          effort: issue.effort,
          textRange: issue.textRange
        }))
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Get coverage information
   */
  async getCoverageMetrics() {
    try {
      const response = await this.sonarApiRequest(`measures/component?component=${this.projectKey}&metricKeys=coverage,line_coverage,branch_coverage,lines_to_cover,uncovered_lines`);
      
      const measures = {};
      if (response.component && response.component.measures) {
        response.component.measures.forEach(measure => {
          measures[measure.metric] = measure.value;
        });
      }

      return measures;
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Get analysis from report-task.txt if available
   */
  async getAnalysisFromReport() {
    const reportPath = path.join(process.cwd(), '.scannerwork', 'report-task.txt');
    
    try {
      const report = fs.readFileSync(reportPath, 'utf8');
      const lines = report.split('\n');
      const taskId = lines.find(line => line.startsWith('ceTaskId='))?.split('=')[1];
      const analysisId = lines.find(line => line.startsWith('analysisId='))?.split('=')[1];
      
      if (taskId) {
        const taskResponse = await this.sonarApiRequest(`ce/task?id=${taskId}`);
        if (taskResponse.task && taskResponse.task.analysisId) {
          const qualityGateResponse = await this.sonarApiRequest(`qualitygates/project_status?analysisId=${taskResponse.task.analysisId}`);
          return qualityGateResponse.projectStatus;
        }
      }
      
      return null;
    } catch (error) {
      return { error: `Could not read analysis report: ${error.message}` };
    }
  }

  /**
   * MCP Server protocol handler
   */
  async handleMCPRequest(request) {
    switch (request.method) {
      case 'sonarqube/quality-gate':
        return await this.getQualityGateStatus();
        
      case 'sonarqube/issues':
        return await this.getProjectIssues(
          request.params?.severity,
          request.params?.type
        );
        
      case 'sonarqube/coverage':
        return await this.getCoverageMetrics();
        
      case 'sonarqube/analysis-report':
        return await this.getAnalysisFromReport();
        
      case 'sonarqube/info':
        return {
          serverUrl: this.serverUrl,
          organization: this.organization,
          projectKey: this.projectKey,
          prContext: this.prContext,
          prNumber: this.prNumber
        };
        
      default:
        return { error: `Unknown method: ${request.method}` };
    }
  }
}

// Export for use in copilot environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SonarQubeMCPServer;
}

// CLI interface for testing
if (require.main === module) {
  const server = new SonarQubeMCPServer();
  
  const command = process.argv[2];
  
  (async () => {
    switch (command) {
      case 'quality-gate':
        console.log(JSON.stringify(await server.getQualityGateStatus(), null, 2));
        break;
        
      case 'issues':
        const severity = process.argv[3];
        const type = process.argv[4];
        console.log(JSON.stringify(await server.getProjectIssues(severity, type), null, 2));
        break;
        
      case 'coverage':
        console.log(JSON.stringify(await server.getCoverageMetrics(), null, 2));
        break;
        
      case 'analysis-report':
        console.log(JSON.stringify(await server.getAnalysisFromReport(), null, 2));
        break;
        
      case 'info':
        console.log(JSON.stringify({
          serverUrl: server.serverUrl,
          organization: server.organization,
          projectKey: server.projectKey,
          prContext: server.prContext,
          prNumber: server.prNumber
        }, null, 2));
        break;
        
      default:
        console.log('Usage: node sonarqube-server.js <command>');
        console.log('Commands: quality-gate, issues [severity] [type], coverage, analysis-report, info');
        break;
    }
  })().catch(console.error);
}