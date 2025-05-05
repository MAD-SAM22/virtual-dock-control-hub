
import express from 'express';
import fs from 'fs';
import path from 'path';
import { exec, execSync, spawn } from 'child_process';
import { VM_DIR, DISK_DIR, ISO_DIR, SNAPSHOT_DIR } from '../index.js';
import { fileExists, readJsonFile, writeJsonFile } from '../utils/fileSystem.js';
import { getVMData, updateVMStatus } from '../utils/vmUtils.js';

const router = express.Router();

// CREATE VM
router.post('/create-vm', (req, res) => {
  const {
    name,
    cpus,
    memory,
    diskName,
    os,
    iso,
    networkType,
    networkBridge,
    enableKVM,
    enableEFI,
    customArgs
  } = req.body;

  if (!name || !cpus || !memory || !diskName) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    // Attempt to resolve disk file with known extensions if not provided
    const possibleExtensions = ['qcow2', 'img', 'raw', 'vmdk'];
    let diskPath = null;
    let diskFormat = null;

    for (const ext of possibleExtensions) {
      const fullPath = path.join(DISK_DIR, diskName.endsWith(`.${ext}`) ? diskName : `${diskName}.${ext}`);
      if (fs.existsSync(fullPath)) {
        diskPath = fullPath;
        diskFormat = ext;
        break;
      }
    }

    if (!diskPath) {
      return res.status(404).json({ error: `Disk file "${diskName}" not found with supported extensions` });
    }

    // Extract disk size using qemu-img
    let diskSize = 0;
    try {
      const output = execSync(`qemu-img info "${diskPath}"`).toString();
      const sizeMatch = output.match(/virtual size:.*\((\d+) bytes\)/);
      diskSize = sizeMatch ? Math.round(parseInt(sizeMatch[1]) / (1024 * 1024 * 1024)) : 0;
    } catch (err) {
      return res.status(500).json({ error: `Failed to read disk info: ${err.message}` });
    }

    if (diskSize <= 0) {
      return res.status(400).json({ error: 'Invalid disk size' });
    }

    // Build QEMU arguments
    const args = [
      '-name', name,
      '-smp', cpus.toString(),
      '-m', `${memory}G`,
      '-drive', `file=${diskPath},format=${diskFormat},if=virtio`
    ];

    // Add ISO
    if (iso) {
      const isoPath = path.join(ISO_DIR, iso);
      if (!fs.existsSync(isoPath)) {
        return res.status(404).json({ error: `ISO file "${iso}" not found` });
      }
      args.push('-cdrom', isoPath, '-boot', 'order=d');
    }

    // Add network
    if (networkType === 'user') {
      args.push('-net', 'nic,model=virtio', '-net', 'user');
    } else if (networkType === 'bridge') {
      const bridge = networkBridge || 'br0';
      args.push('-net', 'nic,model=virtio', '-net', `bridge,br=${bridge}`);
    }

    // Enable KVM/EFI if requested
    if (enableKVM) args.push('-enable-kvm');
    if (enableEFI) args.push('-bios', '/usr/share/ovmf/OVMF.fd');

    // Add custom QEMU arguments
    if (customArgs && customArgs.trim()) {
      args.push(...customArgs.trim().split(/\s+/));
    }

    // Launch the VM
    const qemuProcess = spawn('qemu-system-x86_64', args, {
      detached: true,
      stdio: 'ignore'
    });
    qemuProcess.unref();

    // Save VM metadata
    const vmConfig = {
      id: Date.now().toString(),
      name,
      cpus,
      memory: `${memory} GB`,
      storage: `${diskSize} GB`,
      os: os || 'Custom OS',
      status: 'running',
      diskName: path.basename(diskPath),
      diskFormat,
      iso: iso || null,
      pid: qemuProcess.pid,
      networkType,
      startedAt: new Date().toISOString()
    };

    const vmFilePath = path.join(VM_DIR, `${name}.json`);
    writeJsonFile(vmFilePath, vmConfig);

    console.log(`✅ VM "${name}" started with PID ${qemuProcess.pid}`);
    res.json({
      message: `🖥️ VM "${name}" started successfully`,
      vm: vmConfig
    });

  } catch (err) {
    console.error(`❌ Error creating VM: ${err.message}`);
    res.status(500).json({ error: `Failed to create VM: ${err.message}` });
  }
});

// LIST VMs
router.get('/vms', (req, res) => {
  console.log('GET /vms - Reading VMs from directory:', VM_DIR);

  try {
    // Check if directory exists first
    if (!fileExists(VM_DIR)) {
      console.log('VM directory does not exist, creating it');
      fs.mkdirSync(VM_DIR, { recursive: true });
      return res.json([]);
    }

    const files = fs.readdirSync(VM_DIR).filter(file => file.endsWith('.json'));
    console.log('Found VM files:', files);

    const vmList = files.map(file => {
      try {
        const vmPath = path.join(VM_DIR, file);
        console.log(`Reading VM file: ${vmPath}`);

        const vmData = readJsonFile(vmPath);
        if (!vmData) return null;

        // Update VM status
        return updateVMStatus(vmData);
      } catch (err) {
        console.error(`Error parsing VM file ${file}:`, err);
        return null;
      }
    }).filter(vm => vm !== null);

    console.log(`Successfully loaded ${vmList.length} VMs`);
    res.json(vmList);
  } catch (err) {
    console.error('Error listing VMs:', err);
    res.status(500).json({ error: 'Failed to list VMs: ' + err.message });
  }
});

// GET VM DETAILS
router.get('/vms/:id', (req, res) => {
  const vmId = req.params.id;
  console.log(`GET /vms/${vmId} - Getting VM details`);

  try {
    if (!fileExists(VM_DIR)) {
      return res.status(404).json({ error: 'VM directory not found' });
    }

    const vm = getVMData(vmId);
    if (!vm) {
      console.log(`VM ${vmId} not found`);
      return res.status(404).json({ error: 'VM not found' });
    }

    // Update VM status
    const updatedVM = updateVMStatus(vm.data);
    console.log(`Found VM ${vmId}:`, updatedVM);
    
    res.json(updatedVM);
  } catch (err) {
    console.error(`Error getting VM details for ${vmId}:`, err);
    res.status(500).json({ error: `Failed to get VM details: ${err.message}` });
  }
});

// DELETE VM
router.delete('/vms/:id', (req, res) => {
  const vmId = req.params.id;

  try {
    const vm = getVMData(vmId);
    if (!vm) {
      return res.status(404).json({ error: 'VM not found' });
    }

    // Try to kill the process if it's running
    let killed = false;
    if (vm.data.pid) {
      try {
        // Check if process exists (this throws if it doesn't)
        process.kill(vm.data.pid, 0);
        process.kill(vm.data.pid); // Kill it for real
        killed = true;
      } catch (e) {
        console.warn(`⚠️ VM process PID ${vm.data.pid} already not running.`);
      }
    }

    // Delete the VM config file
    fs.unlinkSync(vm.path);

    // Delete VM disk if requested
    const removeDisks = req.query.removeDisks === 'true';
    if (removeDisks && vm.data.diskName && vm.data.diskFormat) {
      const diskPath = path.join(DISK_DIR, `${vm.data.diskName}.${vm.data.diskFormat}`);
      if (fs.existsSync(diskPath)) {
        fs.unlinkSync(diskPath);
      }
    }

    res.json({
      message: `VM "${vm.data.name}" deleted${killed ? '' : ' (process was already stopped)'}.`,
      removedDisk: removeDisks
    });
  } catch (err) {
    console.error(`Error deleting VM:`, err);
    res.status(500).json({ error: `Failed to delete VM: ${err.message}` });
  }
});

// VM CONTROL ROUTES
router.post('/vms/:id/stop', (req, res) => {
  const vm = getVMData(req.params.id);
  if (!vm) return res.status(404).json({ error: 'VM not found' });
  try {
    process.kill(vm.data.pid);
    vm.data.status = 'stopped';
    writeJsonFile(vm.path, vm.data);
    res.json({ message: `🛑 VM "${vm.data.name}" stopped.` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PAUSE VM
router.post('/vms/:id/pause', (req, res) => {
  const vm = getVMData(req.params.id);
  if (!vm) return res.status(404).json({ error: 'VM not found' });
  try {
    process.kill(vm.data.pid, 'SIGSTOP');
    vm.data.status = 'paused';
    writeJsonFile(vm.path, vm.data);
    res.json({ message: `⏸️ VM "${vm.data.name}" paused.` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// RESUME VM
router.post('/vms/:id/resume', (req, res) => {
  const vm = getVMData(req.params.id);
  if (!vm) return res.status(404).json({ error: 'VM not found' });
  try {
    process.kill(vm.data.pid, 'SIGCONT');
    vm.data.status = 'running';
    writeJsonFile(vm.path, vm.data);
    res.json({ message: `▶️ VM "${vm.data.name}" resumed.` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// RESTART VM (stop + start)
router.post('/vms/:id/restart', (req, res) => {
  const vm = getVMData(req.params.id);
  if (!vm) return res.status(404).json({ error: 'VM not found' });

  try {
    process.kill(vm.data.pid);
    const args = [
      '-name', vm.data.name,
      '-smp', vm.data.cpus.toString(),
      '-m', vm.data.memory,
      '-drive', `file=${path.join(DISK_DIR, `${vm.data.diskName}.${vm.data.diskFormat}`)},format=${vm.data.diskFormat},if=virtio`
    ];
    if (vm.data.iso) {
      const isoPath = path.join(ISO_DIR, vm.data.iso);
      args.push('-cdrom', isoPath, '-boot', 'order=d');
    }
    const proc = spawn('qemu-system-x86_64', args, { detached: true, stdio: 'ignore' });
    proc.unref();
    vm.data.pid = proc.pid;
    vm.data.status = 'running';
    writeJsonFile(vm.path, vm.data);
    res.json({ message: `🔁 VM "${vm.data.name}" restarted.` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// CONSOLE (simulated)
router.get('/vms/:id/console', (req, res) => {
  // Simulated endpoint (actual VNC/SPICE integration needed)
  res.json({ message: '🔧 Console access feature not implemented yet. Use VNC or SPICE frontend.' });
});

// CREATE SNAPSHOT
router.post('/vms/:id/snapshot', (req, res) => {
  const vm = getVMData(req.params.id);
  if (!vm) return res.status(404).json({ error: 'VM not found' });

  const diskPath = path.join(DISK_DIR, `${vm.data.diskName}.${vm.data.diskFormat}`);
  const snapshotPath = path.join(SNAPSHOT_DIR, `${vm.data.diskName}-${Date.now()}.qcow2`);

  try {
    execSync(`qemu-img create -f qcow2 -b "${diskPath}" "${snapshotPath}"`);
    res.json({ message: `📸 Snapshot created: ${snapshotPath}` });
  } catch (e) {
    res.status(500).json({ error: `Failed to create snapshot: ${e.message}` });
  }
});

// EDIT VM config
router.put('/vms/:id', (req, res) => {
  const vm = getVMData(req.params.id);
  if (!vm) return res.status(404).json({ error: 'VM not found' });

  const updates = req.body;
  Object.assign(vm.data, updates);
  writeJsonFile(vm.path, vm.data);
  res.json({ message: `✏️ VM "${vm.data.name}" updated.`, vm: vm.data });
});

// VM METRICS
router.get('/vms/:id/metrics', (req, res) => {
  const vm = getVMData(req.params.id);
  if (!vm) return res.status(404).json({ error: 'VM not found' });
  
  // This would be replaced with actual metrics collection
  res.json({ 
    cpu: Math.random() * 100, 
    memory: Math.random() * 100,
    disk: Math.random() * 100,
    network: Math.random() * 100
  });
});

// VM LOGS
router.get('/vms/:id/logs', (req, res) => {
  const vm = getVMData(req.params.id);
  if (!vm) return res.status(404).json({ error: 'VM not found' });
  
  // This would be replaced with actual log collection
  res.json({ 
    logs: [
      { timestamp: new Date().toISOString(), message: "Sample log entry 1" },
      { timestamp: new Date().toISOString(), message: "Sample log entry 2" }
    ]
  });
});

// MIGRATE (simulation)
router.post('/vms/:id/migrate', (req, res) => {
  res.json({ message: '🚀 VM migration is not yet implemented. Requires cluster setup.' });
});

export default router;
