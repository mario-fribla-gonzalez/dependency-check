const core = require('@actions/core');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const {
  ensureDependencyCheck,
  ensureDataDir,
  ensureYarn,
} = require('./installTools');

async function run() {
  let yarnExists = true;
  if (process.platform !== 'win32') {
    try {
      await ensureYarn();
    } catch {
      yarnExists = false;
    }
  } else {
    yarnExists = false;
  }
  try {
    const project = core.getInput('project');
    const scanPath = core.getInput('path');
    const args = core.getInput('args');
    const version = core.getInput('version');
    const format = core.getInput('format');
    const workdir = core.getInput('workdir');

    // Change to working directory if specified
    if (workdir && workdir !== '.') {
      const targetWorkdir = path.resolve(workdir);
      process.chdir(targetWorkdir);
    }

    // Print pwd for debugging
    console.log(`Current working directory: ${process.cwd()}`);

    // Show files in workdir
    try {
      const files = fs.readdirSync(process.cwd());
      console.log('Files in working directory:');
      files.forEach(file => {
        const stats = fs.statSync(file);
        const size = stats.size;
        const mtime = stats.mtime.toISOString();
        console.log(`${file} - ${size} bytes - modified: ${mtime}`);
      });
    } catch (err) {
      console.log('Could not list files in working directory:', err.message);
    }

    // Install and locate dependency-check tool
    const { dcPath } = await ensureDependencyCheck(version);
    // Ensure data directory exists
    const dataDir = ensureDataDir();

    // Set --disableYarnAudit if yarn is not installed
    let disableYarnAudit = '';
    if (!yarnExists) {
      disableYarnAudit = '--disableYarnAudit';
      console.log('Yarn not found or Windows detected, adding --disableYarnAudit to dependency-check options.');
    }

    // Show cache content
    if (fs.existsSync(dataDir)) {
      console.log('Dependency-Check cache directory content:');
      const files = fs.readdirSync(dataDir);
      files.forEach(file => {
        const filePath = path.join(dataDir, file);
        const stats = fs.statSync(filePath);
        const size = stats.size;
        const mtime = stats.mtime.toISOString();
        console.log(`${file} - ${size} bytes - modified: ${mtime}`);
      });
    } else {
      console.log('Dependency-Check cache directory does not exist.');
    }

    // Support comma-separated formats and add all as --format options
    const formats = (format || 'JSON').split(',').map(f => f.trim()).filter(f => f);
    const formatArgs = formats.map(f => `--format ${f}`).join(' ');

    // Add --nvdApiKey if NVD_API_KEY env variable is set
    const nvdApiKeyArg = process.env.NVD_API_KEY ? `--nvdApiKey "${process.env.NVD_API_KEY}"` : '';

    // Run dependency-check with all formats at once
    const cmd = `${dcPath} --project "${project}" --scan "${scanPath}" ${formatArgs} --data "${dataDir}" ${nvdApiKeyArg} ${disableYarnAudit} ${args}`;
    console.log(`Running: ${cmd}`);
    execSync(cmd, { stdio: 'inherit' });

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
