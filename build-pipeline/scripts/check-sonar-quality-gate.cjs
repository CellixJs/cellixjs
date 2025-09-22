const https = require('node:https');
const fs = require('node:fs');
const path = require('node:path');

// Default report-task.txt path (customize if needed)
const reportPath = path.join(process.cwd(), '.scannerwork', 'report-task.txt');


// SonarCloud API authentication (requires SONAR_TOKEN env var)
const sonarToken = process.env.SONAR_TOKEN;
if (!sonarToken) {
  throw new Error('SONAR_TOKEN environment variable is not set.');
}

// Read report-task.txt
let report;
try {
  report = fs.readFileSync(reportPath, 'utf8');
} catch (error) {
  throw new Error(`Could not read report-task.txt at ${reportPath}: ${error.message}`);
}

const lines = report.split('\n');
const taskId = lines.find(line => line.startsWith('ceTaskId='))?.split('=')[1];
const serverUrl = lines.find(line => line.startsWith('serverUrl='))?.split('=')[1];

if (!taskId || !serverUrl) {
  throw new Error('Could not find ceTaskId or serverUrl in report-task.txt.');
}

// Function to make API request
function sonarApiRequest(endpoint, callback) {
  let hostname;
  try {
    hostname = new URL(serverUrl).hostname;
  } catch (error) {
    throw new Error(`Invalid serverUrl in report-task.txt: ${error.message}`);
  }

  const options = {
    hostname,
    path: `/api/${endpoint}`,
    method: 'GET',
    headers: {
      'Authorization': `Basic ${Buffer.from(`${sonarToken}:`).toString('base64')}`
    }
  };

  const req = https.request(options, res => {
    let data = '';
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => callback(null, data));
  });

  req.on('error', error => callback(error));
  req.end();
}

// Poll task status until complete
const maxPollAttempts = 12; // 60 seconds / 5 seconds per poll
let pollCount = 0;

function pollTaskStatus() {
  sonarApiRequest(`ce/task?id=${taskId}`, (error, response) => {
    if (error) {
      throw new Error(`Failed to fetch task status: ${error.message}`);
    }

    let taskResponse;
    try {
      taskResponse = JSON.parse(response);
    } catch (_) {
      throw new Error('Invalid task response from SonarCloud.');
    }

    if (taskResponse.errors) {
      throw new Error(`SonarCloud API error: ${taskResponse.errors.map(e => e.msg).join(', ')}. Ensure npm run sonar:pr completed successfully and report-task.txt is fresh.`);
    }

    if (!taskResponse.task) {
      throw new Error('No task found in SonarCloud response.');
    }

    const { task } = taskResponse;
    if (task.status === 'SUCCESS') {
      // Get Quality Gate status
      sonarApiRequest(`qualitygates/project_status?analysisId=${task.analysisId}`, (error, response) => {
        if (error) {
          throw new Error(`Failed to fetch Quality Gate status: ${error.message}`);
        }

        let qualityGate;
        try {
          qualityGate = JSON.parse(response);
        } catch (_) {
          throw new Error('Invalid Quality Gate response from SonarCloud.');
        }

        if (!qualityGate.projectStatus) {
          throw new Error('No projectStatus in Quality Gate response.');
        }

        const { status } = qualityGate.projectStatus;
        if (status === 'OK') {
          console.log('Quality Gate passed.');
          process.exit(0);
        } else {
          throw new Error(`Quality Gate failed.\nFailure details: ${JSON.stringify(qualityGate.projectStatus, null, 2)}`);
        }
      });
    } else if (task.status === 'FAILED' || task.status === 'CANCELED') {
      throw new Error(`Analysis did not complete successfully. Status: ${task.status}`);
    } else if (pollCount >= maxPollAttempts) {
      throw new Error('Analysis polling timed out after 60 seconds.');
    } else {
      pollCount++;
      setTimeout(pollTaskStatus, 5000); // Poll every 5 seconds
    }
  });
}

pollTaskStatus();