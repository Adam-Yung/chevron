// The pure parts of install.cjs: what goes into a service file, and which names it accepts.
const path = require('path');

function fillTemplate(content, vars) {
  return Object.entries(vars).reduce(
    (str, [key, val]) => str.replaceAll(`{{${key}}}`, val),
    content
  );
}

// launchd and systemd start with a bare PATH, so it names the folder npx (and node) live in.
function unixVars(projectDir, npxPath) {
  const envPath = [path.dirname(npxPath), '/usr/local/bin', '/usr/bin', '/bin'].join(':');
  return { PROJECT_DIR: projectDir, NPX_PATH: npxPath, PATH: envPath };
}

// Task Scheduler and spawn() need a real Windows executable: where.exe also lists POSIX shebang scripts, which fail both.
function preferWindowsExecutable(results) {
  return (
    results.find(p => /\.exe$/i.test(p)) ||
    results.find(p => /\.cmd$/i.test(p)) ||
    results[0]
  );
}

function platformKind(platform) {
  if (platform === 'darwin' || platform === 'mac') return 'mac';
  if (platform === 'linux') return 'linux';
  if (platform === 'win32' || platform === 'windows') return 'windows';
  return null;
}

module.exports = { fillTemplate, unixVars, preferWindowsExecutable, platformKind };
