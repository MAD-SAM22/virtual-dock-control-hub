
import express from 'express';
import { execSync } from 'child_process';
import os from 'os';
import { DISK_DIR, ISO_DIR, VM_DIR, SNAPSHOT_DIR } from '../index.js';
import { fileExists } from '../utils/fileSystem.js';

const router = express.Router();

// Fix: Ensure the route path is properly formatted without any trailing colons
router.get('/status', (req, res) => {
  try {
    // Check if directories exist
    const dirs = [VM_DIR, DISK_DIR, ISO_DIR, SNAPSHOT_DIR];
    const dirStatus = dirs.map(dir => ({
      path: dir,
      exists: fileExists(dir)
    }));
    
    // Check if QEMU is installed
    let qemuInstalled = false;
    let qemuVersion = null;
    
    try {
      qemuVersion = execSync('qemu-img --version').toString().trim();
      qemuInstalled = true;
    } catch (err) {
      console.error('QEMU not found:', err);
    }
    
    res.json({
      status: 'operational',
      server: {
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version
      },
      qemu: {
        installed: qemuInstalled,
        version: qemuVersion
      },
      directories: dirStatus
    });
  } catch (err) {
    console.error('Error checking server status:', err);
    res.status(500).json({ error: 'Failed to check server status' });
  }
});

export default router;
