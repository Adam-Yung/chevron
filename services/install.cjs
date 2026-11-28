const { execSync, spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { fillTemplate, unixVars, preferWindowsExecutable, platformKind } = require('./serviceFiles.cjs');

const platform = process.argv[2] || process.platform;
const projectDir = path.resolve(__dirname, '..');

function fail(...lines) {
  for (const line of lines) console.error(line);
  process.exit(1);
}

function which(cmd) {
  try {
    return execSync(`which ${cmd}`, { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

function whichWin(cmd) {
  try {
    const results = execSync(`where.exe ${cmd}`, { encoding: 'utf8' })
      .trim().split(/\r?\n/);
    return preferWindowsExecutable(results);
  } catch {
    return null;
  }
}

function renderTemplate(name, vars) {
  return fillTemplate(fs.readFileSync(path.join(__dirname, name), 'utf8'), vars);
}

function renderUnixService(templateName) {
  const npxPath = which('npx');
  if (!npxPath) fail('Error: npx not found in PATH');
  return renderTemplate(templateName, unixVars(projectDir, npxPath));
}

function writeServiceFile(dest, content) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, content);
  console.log(`Wrote ${dest}`);
}

function installMac() {
  const content = renderUnixService('com.chevron.preview.plist');
  const dest = path.join(os.homedir(), 'Library', 'LaunchAgents', 'com.chevron.preview.plist');

  try {
    execSync(`launchctl unload "${dest}" 2>/dev/null`, { stdio: 'ignore' });
  } catch {
    // not loaded yet
  }

  writeServiceFile(dest, content);

  execSync(`launchctl load "${dest}"`);
  console.log('Service loaded. Access at http://localhost:4173/');
  console.log('');
  console.log('To stop:  launchctl unload ~/Library/LaunchAgents/com.chevron.preview.plist');
  console.log('To start: launchctl load ~/Library/LaunchAgents/com.chevron.preview.plist');
}

function installLinux() {
  const content = renderUnixService('chevron-preview.service');
  const dest = path.join(os.homedir(), '.config', 'systemd', 'user', 'chevron-preview.service');

  writeServiceFile(dest, content);

  execSync('systemctl --user daemon-reload');
  execSync('systemctl --user enable --now chevron-preview.service');
  console.log('Service enabled and started. Access at http://localhost:4173/');
  console.log('');
  console.log('To stop:    systemctl --user stop chevron-preview');
  console.log('To disable: systemctl --user disable chevron-preview');
  console.log('To logs:    journalctl --user -u chevron-preview -f');
}

function isAdminWindows() {
  try {
    execSync('net session', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function requireWindowsAdmin() {
  if (process.platform !== 'win32') fail('Error: install_windows_service must be run on Windows.');
  if (isAdminWindows()) return;
  fail(
    '',
    'ERROR: Administrator privileges are required to register a scheduled task.',
    '',
    'Please re-run from an elevated terminal:',
    '  1. Search "Terminal" in Start',
    '  2. Right-click → "Run as administrator"',
    '  3. cd to the chevron directory and run: npm run install_windows_service',
    ''
  );
}

// node.exe and vite's JS entry point directly, so neither the task nor the spawned server depends on npx or PATH.
function findWindowsRuntime() {
  const nodePath = whichWin('node');
  if (!nodePath) fail('Error: node.exe not found in PATH. Make sure Node.js is installed.');
  const viteJs = path.join(projectDir, 'node_modules', 'vite', 'bin', 'vite.js');
  if (!fs.existsSync(viteJs)) fail(`Error: vite not found at ${viteJs}. Run npm install first.`);
  return { nodePath, viteJs };
}

function registerWindowsTask(taskName, { nodePath, viteJs }) {
  const vars = { PROJECT_DIR: projectDir, NODE_EXE: nodePath, VITE_JS: viteJs };
  const tmpXml = path.join(os.tmpdir(), 'chevron-preview-task.xml');
  const content = renderTemplate('chevron-preview.xml', vars);

  // Task Scheduler XML must be UTF-16 LE
  fs.writeFileSync(tmpXml, '\ufeff' + content, 'utf16le');
  console.log(`Wrote task XML to ${tmpXml}`);

  // Delete existing task silently, then import
  spawnSync('schtasks.exe', ['/Delete', '/TN', taskName, '/F'], { stdio: 'ignore' });
  const result = spawnSync(
    'schtasks.exe',
    ['/Create', '/TN', taskName, '/XML', tmpXml],
    { encoding: 'utf8', stdio: 'pipe' }
  );

  if (result.status !== 0) fail('Failed to register scheduled task:', result.stderr || result.stdout);
  console.log(`Task "${taskName}" registered successfully.`);
}

// The task only fires at logon, so also start the server in this session after freeing the port.
function restartWindowsServer({ nodePath, viteJs }) {
  spawnSync('powershell.exe', [
    '-NoProfile', '-Command',
    `$p = (Get-NetTCPConnection -LocalPort 4173 -ErrorAction SilentlyContinue).OwningProcess; if ($p) { Stop-Process -Id $p -Force -ErrorAction SilentlyContinue }`
  ], { stdio: 'ignore' });

  const child = spawn(
    nodePath,
    [viteJs, 'preview', '--port', '4173', '--host', '::'],
    {
      cwd: projectDir,
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    }
  );
  child.unref();
  console.log(`Server started (pid ${child.pid}). Access at http://localhost:4173/`);
}

function installWindows() {
  requireWindowsAdmin();
  const runtime = findWindowsRuntime();
  const taskName = 'ChevronPreview';
  registerWindowsTask(taskName, runtime);
  restartWindowsServer(runtime);

  console.log('');
  console.log(`To stop:    schtasks /End /TN ${taskName}`);
  console.log(`To disable: schtasks /Change /TN ${taskName} /Disable`);
  console.log(`To delete:  schtasks /Delete /TN ${taskName} /F`);
}

const dist = path.join(projectDir, 'dist');
if (!fs.existsSync(dist)) {
  console.log('Building project first (dist/ not found)...');
  execSync('npm run build', { cwd: projectDir, stdio: 'inherit' });
}

const INSTALLERS = { mac: installMac, linux: installLinux, windows: installWindows };
const kind = platformKind(platform);
if (!kind) fail(`Unsupported platform: ${platform}`, 'Usage: node services/install.cjs [mac|linux|windows]');
INSTALLERS[kind]();
