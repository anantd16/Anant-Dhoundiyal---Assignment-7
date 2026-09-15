const fs = require('fs/promises');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');

// Per-file write queues to avoid two concurrent requests clobbering
// each other's writes to the same JSON file (basic race-condition guard
// since we don't have a real database with transactions here).
const writeQueues = {};

function queueWrite(filename, task) {
  const prev = writeQueues[filename] || Promise.resolve();
  const next = prev.then(task, task);
  writeQueues[filename] = next.catch(() => {}); // don't let a failure block the queue
  return next;
}

/**
 * Reads and parses a JSON file from the data directory.
 * Returns an empty array if the file doesn't exist or is invalid.
 */
async function readData(filename) {
  const filePath = path.join(DATA_DIR, filename);
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

/**
 * Serializes and writes data to a JSON file in the data directory.
 * Writes to the same filename are queued to run sequentially.
 */
async function writeData(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  return queueWrite(filename, async () => {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  });
}

module.exports = { readData, writeData };
