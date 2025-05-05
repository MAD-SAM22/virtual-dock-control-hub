
import fs from 'fs';
import path from 'path';
import { VM_DIR } from '../index.js';
import { readJsonFile } from './fileSystem.js';

/**
 * Get VM data by ID
 * @param {string} vmId - VM ID
 * @returns {Object|null} - VM data and path or null if not found
 */
export const getVMData = (vmId) => {
  const files = fs.readdirSync(VM_DIR).filter(f => f.endsWith('.json'));
  for (const file of files) {
    const fullPath = path.join(VM_DIR, file);
    const data = readJsonFile(fullPath);
    if (data && data.id === vmId) return { path: fullPath, data };
  }
  return null;
};

/**
 * Calculate VM uptime
 * @param {string} startedAt - ISO timestamp when VM was started
 * @returns {string} - Formatted uptime string
 */
export const calculateUptime = (startedAt) => {
  if (!startedAt) return undefined;
  
  const startTime = new Date(startedAt).getTime();
  const currentTime = new Date().getTime();
  const uptimeMs = currentTime - startTime;

  // Format uptime
  const seconds = Math.floor(uptimeMs / 1000) % 60;
  const minutes = Math.floor(uptimeMs / (1000 * 60)) % 60;
  const hours = Math.floor(uptimeMs / (1000 * 60 * 60)) % 24;
  const days = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));

  if (days > 0) {
    return `${days} day${days !== 1 ? 's' : ''}, ${hours} hour${hours !== 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}, ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  } else {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}, ${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
};

/**
 * Check if a VM process is running
 * @param {number} pid - Process ID
 * @returns {boolean} - True if process is running, false otherwise
 */
export const isProcessRunning = (pid) => {
  if (!pid) return false;
  
  try {
    // This will throw if process doesn't exist
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Update VM status based on process state
 * @param {Object} vmData - VM data object
 * @returns {Object} - Updated VM data
 */
export const updateVMStatus = (vmData) => {
  if (!vmData) return vmData;
  
  const updatedData = { ...vmData };
  
  // Check if VM is still running (if it has a PID)
  if (updatedData.pid && isProcessRunning(updatedData.pid)) {
    updatedData.status = 'running';
    // Calculate uptime if VM is running
    if (updatedData.startedAt) {
      updatedData.uptime = calculateUptime(updatedData.startedAt);
    }
  } else {
    updatedData.status = 'stopped';
    updatedData.uptime = undefined;
  }
  
  return updatedData;
};
