const { execSync, spawnSync } = require('child_process');
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

function whichWin(cmd) {
  try {
    return execSync(`where.exe ${cmd}`, { encoding: 'utf8' }).trim().split(/\r?\n/)[0];
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

function isAdminWindows() {
  try {
    execSync('net session', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function installWindows() {
  if (process.platform !== 'win32') {
    console.error('Error: install_windows_service must be run on Windows.');
    process.exit(1);
  }

  // Re-launch elevated if not already running as admin.
  // Uses a temp batch file + cmd.exe as the elevation vehicle because
  // directly elevating node.exe via ShellExecuteEx (-Verb RunAs) fails with
  // version manager shims (volta, fnm, nvm) — they don't pass PE validation.
  // cmd.exe is always a valid Win32 app; the batch just calls node via PATH.
  if (!isAdminWindows()) {
    console.log('Administrator privileges required. Requesting elevation via UAC...');
    const tmpBat = path.join(os.tmpdir(), 'chevron_install_elevate.bat');
    fs.writeFileSync(tmpBat, `@echo off\nnode "${__filename}" windows\n`);
    const batPs = tmpBat.replace(/'/g, "''");   // escape single-quotes for PS
    const elevated = spawnSync('powershell.exe', [
      '-NoProfile', '-Command',
      `Start-Process cmd.exe -ArgumentList @('/c', '${batPs}') -Verb RunAs -Wait`
    ], { stdio: 'inherit' });
    try { fs.unlinkSync(tmpBat); } catch {}
    process.exit(elevated.status ?? 0);
  }

  const npxPath = whichWin('npx');
  if (!npxPath) {
    console.error('Error: npx not found in PATH. Make sure Node.js is installed.');
    process.exit(1);
  }

  const taskName = 'ChevronPreview';
  const vars = { PROJECT_DIR: projectDir, NPX_PATH: npxPath };

  const src = path.join(__dirname, 'chevron-preview.xml');
  const tmpXml = path.join(os.tmpdir(), 'chevron-preview-task.xml');

  const content = template(fs.readFileSync(src, 'utf8'), vars);

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

  if (result.status !== 0) {
    console.error('Failed to register scheduled task:');
    console.error(result.stderr || result.stdout);
    process.exit(1);
  }

  console.log(`Task "${taskName}" registered successfully.`);

  // Enforce constraints via PowerShell — matches AHK install.bat pattern.
  // Redundant with the XML settings but guarantees they are applied.
  const psResult = spawnSync('powershell.exe', [
    '-NoProfile', '-NonInteractive', '-Command',
    `$name = '${taskName}'; $task = Get-ScheduledTask -TaskName $name; $s = $task.Settings; ` +
    `$s.ExecutionTimeLimit = 'PT0S'; $s.DisallowStartIfOnBatteries = $false; ` +
    `$s.StopIfGoingOnBatteries = $false; $s.IdleSettings.StopOnIdleEnd = $false; ` +
    `Set-ScheduledTask -TaskName $name -Settings $s | Out-Null; Write-Host 'Settings applied: no time limit, runs on battery, ignores idle.'`
  ], { encoding: 'utf8', stdio: 'pipe' });

  if (psResult.status !== 0) {
    console.warn('Warning: PowerShell settings update failed. Task was created but may have default constraints.');
    console.warn(psResult.stderr || psResult.stdout);
  } else {
    console.log(psResult.stdout.trim());
  }

  // Kill any existing vite preview on port 4173 so we can start fresh
  spawnSync('powershell.exe', [
    '-NoProfile', '-Command',
    `$p = (Get-NetTCPConnection -LocalPort 4173 -ErrorAction SilentlyContinue).OwningProcess; if ($p) { Stop-Process -Id $p -Force -ErrorAction SilentlyContinue }`
  ], { stdio: 'ignore' });

  // Spawn the server in the current interactive session so it's available immediately.
  // Use the resolved npxPath (not bare 'npx') to avoid PATH lookup failures.
  const { spawn } = require('child_process');
  const child = spawn(
    npxPath,
    ['vite', 'preview', '--port', '4173'],
    {
      cwd: projectDir,
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    }
  );
  child.unref();
  console.log(`Server started (pid ${child.pid}). Access at http://localhost:4173/`);

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

if (platform === 'darwin' || platform === 'mac') {
  installMac();
} else if (platform === 'linux') {
  installLinux();
} else if (platform === 'win32' || platform === 'windows') {
  installWindows();
} else {
  console.error(`Unsupported platform: ${platform}`);
  console.error('Usage: node services/install.cjs [mac|linux|windows]');
  process.exit(1);
}
