const { execSync } = require('node:child_process');

// Function to run shell commands and capture output
function runCommand(command, options = {}) {
  try {
    return execSync(command, { encoding: 'utf8', shell: false, ...options }).trim();
  } catch (error) {
    console.error(`Error running command "${command}": ${error.message}`);
    return null; // Return null instead of exiting to allow fallback
  }
}

// Step 1: Configure Git authentication if GH_TOKEN is provided
function configureGitAuth() {
  const token = process.env.GH_TOKEN;
  if (token) {
    console.error('Configuring Git with GH_TOKEN for HTTPS authentication.');
    try {
      runCommand(`git config --global credential.helper store`);
      runCommand(`echo "https://x-access-token:${token}@github.com" > ~/.git-credentials`);
      console.error('Git credentials configured with GH_TOKEN.');
    } catch (error) {
      console.error('Failed to configure Git credentials:', error.message);
      process.exit(1);
    }
  } else {
    console.error('No GH_TOKEN provided. Using local Git authentication context.');
  }
}

// Step 2: Get the current Git branch or PR source branch
function getCurrentBranch() {
  // Check Azure DevOps PR source branch first
  const prSourceBranch = process.env['System.PullRequest.SourceBranch'];
  if (prSourceBranch) {
    console.error(`Using Azure DevOps PR source branch: ${prSourceBranch}`);
    return prSourceBranch.replace(/^refs\/heads\//, ''); // Strip 'refs/heads/' prefix
  }

  // Fallback to git command
  const currentBranch = runCommand('git branch --show-current');
  if (!currentBranch) {
    console.error('No current branch found. Are you in a Git repository?');
    process.exit(1);
  }
  console.error(`Current branch from Git: ${currentBranch}`);
  return currentBranch;
}

// Step 3: Get repository owner and name from remote URL
function getRepoInfo() {
  try {
    const remoteUrl = runCommand('git config --get remote.origin.url');
    const match = remoteUrl.match(/github\.com[/:]([^/]+)\/([^/]+?)(\.git)?$/);
    if (!match) {
      throw new Error('Could not parse GitHub repository from remote URL: ' + remoteUrl);
    }
    const owner = match[1];
    const repo = match[2];
    console.error(`Repository: ${owner}/${repo}`);
    return { owner, repo };
  } catch (error) {
    console.error('Failed to get repository info:', error.message);
    process.exit(1);
  }
}

// Step 4: Ensure the branch is pushed to the remote
function pushBranch(branch) {
  try {
    runCommand(`git push origin ${branch}`);
    console.error(`Pushed branch ${branch} to remote`);
  } catch (error) {
    console.error(`Failed to push branch ${branch}. It may not exist on remote: ${error.message}`);
    process.exit(1);
  }
}

// Step 5: Fetch PR number using curl and GitHub API
function getPRNumber(owner, repo, branch) {
  try {
    const token = process.env.GH_TOKEN || '';
    const authHeader = token ? `-H "Authorization: token ${token}"` : '';
    const command = `curl -s ${authHeader} "https://api.github.com/repos/${owner}/${repo}/pulls?head=${owner}:${branch}&state=open" | jq '.[0].number'`;
    const prNumber = runCommand(command);
    if (!prNumber || prNumber === 'null') {
      throw new Error('No open PR found for branch ' + branch);
    }
    return prNumber;
  } catch (error) {
    console.error(`Error fetching PR number: ${error.message}`);
    process.exit(1);
  }
}

// Step 6: Main function to get and output PR number
function main() {
  // Configure Git authentication
  configureGitAuth();

  // Get branch and repo info
  const currentBranch = getCurrentBranch();
  const { owner, repo } = getRepoInfo();

  // Push the branch
  pushBranch(currentBranch);

  // Get PR number and output to stdout
  const prNumber = getPRNumber(owner, repo, currentBranch);
  console.log(prNumber); // Output only the PR number to stdout
}

// Run the script
main();