// audit.js – simple immutable audit logging module
// Usage: const audit = require('./audit');
// audit.record({event: 'tool-run', details: {...}});

const fs = require('fs');
const path = require('path');

// Log file location (in workspace root for simplicity)
const LOG_FILE = path.resolve(__dirname, '../../audit.log');

// Ensure directory exists (log file will be created on first write)
function ensureLogFile() {
  try {
    fs.mkdirSync(path.dirname(LOG_FILE), {recursive: true});
    if (!fs.existsSync(LOG_FILE)) {
      fs.writeFileSync(LOG_FILE, '');
    }
  } catch (e) {
    console.error('Audit log init error:', e);
  }
}

ensureLogFile();

function record(entry) {
  const timestamp = new Date().toISOString();
  const record = {timestamp, ...entry};
  try {
    fs.appendFileSync(LOG_FILE, JSON.stringify(record) + '\n');
  } catch (e) {
    console.error('Audit log write error:', e);
  }
}

module.exports = {record};
