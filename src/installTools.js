const { execSync } = require('child_process');
async function ensureYarn() {
  try {
    execSync('yarn --version', { stdio: 'ignore' });
    console.log('Yarn is already installed.');
  } catch (err) {
    console.log('Yarn not found, installing...');
    if (process.platform === 'darwin' || process.platform === 'linux') {
      try {
        execSync('npm install -g yarn', { stdio: 'inherit' });
        console.log('Yarn installed successfully.');
      } catch (installErr) {
        console.error('Failed to install yarn:', installErr.message);
        throw installErr;
      }
    } else {
      console.warn('Automatic yarn installation is not supported on this OS. Please install yarn manually.');
      throw err;
    }
  }
}
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');
const AdmZip = require('adm-zip');

async function downloadAndExtractDC(url, extractTo) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download: ${res.statusText}`);
  const buffer = await res.buffer();
  const zipPath = path.join(extractTo, 'dependency-check.zip');
  fs.writeFileSync(zipPath, buffer);

  const zip = new AdmZip(zipPath);
  zip.extractAllTo(extractTo, true);
}

async function ensureDependencyCheck(version) {
  const toolsDir = process.env['RUNNER_TOOL_CACHE'] || 'dependency-check';
  const dcDir = path.join(toolsDir, `dependency-check-${version}`);

  if (!fs.existsSync(dcDir)) {
    fs.mkdirSync(dcDir, { recursive: true });
    const url = `https://github.com/dependency-check/DependencyCheck/releases/download/v${version}/dependency-check-${version}-release.zip`;
    await downloadAndExtractDC(url, dcDir);
  }
  const binDir = path.join(dcDir, 'dependency-check', 'bin');
  const dcPath = process.platform === 'win32'
    ? path.join(binDir, 'dependency-check.bat')
    : path.join(binDir, 'dependency-check.sh');
  return { dcDir, dcPath };
}

function ensureDataDir() {
  const dataDir = path.resolve(process.env['HOME'] || process.env['USERPROFILE'], '.dependency-check');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return dataDir;
}

module.exports = {
  downloadAndExtractDC,
  ensureDependencyCheck,
  ensureDataDir,
  ensureYarn,
};
