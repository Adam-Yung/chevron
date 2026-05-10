const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const platform = process.argv[2] || process.platform;
const projectDir = path.resolve(__dirname, '..');

function which(cmd) {
  try {
    return execSync(`which ${cmd}`, { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

function template(content, vars) {
  return Object.entries(vars).reduce(
    (str, [key, val]) => str.replaceAll(`{{${key}}}`, val),
    content
  );
}

function installMac() {
  const npxPath = which('npx');
  if (!npxPath) {
    console.error('Error: npx not found in PATH');
    process.exit(1);
  }

  const envPath = [path.dirname(npxPath), '/usr/local/bin', '/usr/bin', '/bin'].join(':');
  const vars = { PROJECT_DIR: projectDir, NPX_PATH: npxPath, PATH: envPath };

  const src = path.join(__dirname, 'com.chevron.preview.plist');
  const dest = path.join(os.homedir(), 'Library', 'LaunchAgents', 'com.chevron.preview.plist');

  const content = template(fs.readFileSync(src, 'utf8'), vars);

  try {
    execSync(`launchctl unload "${dest}" 2>/dev/null`, { stdio: 'ignore' });
  } catch {}

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, content);
  console.log(`Wrote ${dest}`);

  execSync(`launchctl load "${dest}"`);
  console.log('Service loaded. Access at http://localhost:4173/');
  console.log('');
  console.log('To stop:  launchctl unload ~/Library/LaunchAgents/com.chevron.preview.plist');
  console.log('To start: launchctl load ~/Library/LaunchAgents/com.chevron.preview.plist');
}

function installLinux() {
  const npxPath = which('npx');
  if (!npxPath) {
    console.error('Error: npx not found in PATH');
    process.exit(1);
  }

  const envPath = [path.dirname(npxPath), '/usr/local/bin', '/usr/bin', '/bin'].join(':');
  const vars = { PROJECT_DIR: projectDir, NPX_PATH: npxPath, PATH: envPath };

  const src = path.join(__dirname, 'chevron-preview.service');
  const destDir = path.join(os.homedir(), '.config', 'systemd', 'user');
  const dest = path.join(destDir, 'chevron-preview.service');

  const content = template(fs.readFileSync(src, 'utf8'), vars);

  fs.mkdirSync(destDir, { recursive: true });
  fs.writeFileSync(dest, content);
  console.log(`Wrote ${dest}`);

  execSync('systemctl --user daemon-reload');
  execSync('systemctl --user enable --now chevron-preview.service');
  console.log('Service enabled and started. Access at http://localhost:4173/');
  console.log('');
  console.log('To stop:    systemctl --user stop chevron-preview');
  console.log('To disable: systemctl --user disable chevron-preview');
  console.log('To logs:    journalctl --user -u chevron-preview -f');
}

const dist = path.join(projectDir, 'dist');
if (!fs.existsSync(dist)) {
  console.log('Building project first (dist/ not found)...');
  execSync('npm run build', { cwd: projectDir, stdio: 'inherit' });
}

if (platform === 'darwin' || platform === 'mac') {
  installMac();
} else if (platform === 'linux') {
  installLinux();
} else {
  console.error(`Unsupported platform: ${platform}`);
  console.error('Usage: node services/install.cjs [mac|linux]');
  process.exit(1);
}
