import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import qemuRouter from './qemu/index.js';
import dockerRouter from './dockerServer.js';
import os from 'os';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '5000mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '5000mb' }));

// Health check endpoint
app.get('/_ping', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Debug middleware to log requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// System information API - ensure proper route path format
app.get('/system/info', (req, res) => {
  try {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memoryUsage = Math.round(((totalMem - freeMem) / totalMem) * 100);
    
    // Calculate CPU load
    const cpuCount = cpus.length;
    let totalIdle = 0;
    let totalTick = 0;
    
    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });
    
    const cpuLoad = Math.round(100 - ((totalIdle / totalTick) * 100));
    
    // Get disk info
    const uptime = os.uptime();
    const platform = os.platform();
    const hostname = os.hostname();
    
    res.json({
      system: {
        hostname,
        platform,
        uptime: Math.floor(uptime),
        uptimeFormatted: formatUptime(uptime),
        cpuCount,
        cpuModel: cpus[0]?.model || 'Unknown CPU',
        cpuLoad: `${cpuLoad}%`,
        totalMemory: formatBytes(totalMem),
        freeMemory: formatBytes(freeMem),
        memoryUsage: `${memoryUsage}%`,
      }
    });
  } catch (err) {
    console.error('Error getting system info:', err);
    res.status(500).json({ error: 'Failed to retrieve system information' });
  }
});

// Helper functions for formatting
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatUptime(seconds) {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const parts = [];
  
  if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
  if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
  
  return parts.join(', ');
}

// Mount the QEMU API router - ensuring proper path
app.use('/qemu', qemuRouter);

// Mount the Docker router - ensuring no path-to-regexp errors
app.use('/', dockerRouter);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`QEMU API available at http://localhost:${PORT}/qemu`);
  console.log(`Docker API available at http://localhost:${PORT}`);
  console.log(`System info available at http://localhost:${PORT}/system/info`);
});

export default app;
