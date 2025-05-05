
import fs from 'fs';

/**
 * Ensures that the given directories exist
 * @param {string[]} directories - Array of directory paths
 */
export const ensureDirectories = (directories) => {
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

/**
 * Checks if a file exists at the given path
 * @param {string} filePath - Path to check
 * @returns {boolean} - True if file exists, false otherwise
 */
export const fileExists = (filePath) => {
  return fs.existsSync(filePath);
};

/**
 * Reads a JSON file
 * @param {string} filePath - Path to JSON file
 * @returns {Object} - Parsed JSON data
 */
export const readJsonFile = (filePath) => {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading JSON file ${filePath}:`, err);
    return null;
  }
};

/**
 * Writes data to a JSON file
 * @param {string} filePath - Path to JSON file
 * @param {Object} data - Data to write
 */
export const writeJsonFile = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};
