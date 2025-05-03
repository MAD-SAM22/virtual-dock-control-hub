import express from 'express';
import bodyParser from 'body-parser';
import { exec, execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import multer from 'multer';

const router = express.Router();

// Increase the JSON body size limit for base64-encoded files
router.use(bodyParser.json({ limit: '500000mb' }));
router.use(bodyParser.urlencoded({ extended: true, limit: '500000mb' }));

// Define directories
// Get current file path (using ES module approach)
const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

// Define directories (in the same directory as this file)
const DISK_DIR = path.resolve(__dirname, 'disks');
const ISO_DIR = path.resolve(__dirname, 'iso');
const VM_DIR = path.resolve(__dirname, 'vms');
const SNAPSHOT_DIR = path.join(__dirname, 'snapshots');

[VM_DIR, DISK_DIR, SNAPSHOT_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Create directories if they don't exist
if (!fs.existsSync(VM_DIR)) fs.mkdirSync(VM_DIR, { recursive: true });
if (!fs.existsSync(ISO_DIR)) fs.mkdirSync(ISO_DIR, { recursive: true });
if (!fs.existsSync(DISK_DIR)) fs.mkdirSync(DISK_DIR, { recursive: true });

// Configure multer for ISO uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, ISO_DIR);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 * 1024 }, // 10 GB
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/x-iso9660-image' || file.originalname.endsWith('.iso')) {
            cb(null, true);
        } else {
            cb(new Error('Only ISO files are allowed'));
        }
    }
});


// Constants
const RESIZE_SUPPORTED_FORMATS = ['qcow2', 'raw', 'vmdk'];
const SUPPORTED_FORMATS = ['qcow2', 'vmdk', 'raw', 'vdi', 'vpc'];
const DYNAMIC_ONLY_FORMATS = ['vdi', 'vpc'];
const FIXED_UNSUPPORTED_ON_WINDOWS = ['qcow2'];

// List ISO files
router.get('/list-isos', (req, res) => {
    try {
        const files = fs.readdirSync(ISO_DIR).filter(file => file.endsWith('.iso'));
        const isoFiles = files.map(file => {
            const filePath = path.join(ISO_DIR, file);
            const stats = fs.statSync(filePath);
            return {
                name: file,
                size: (stats.size / (1024 * 1024)).toFixed(2) + ' MB',
                lastModified: stats.mtime
            };
        });
        res.json(isoFiles);
    } catch (err) {
        console.error('Error listing ISO files:', err);
        res.status(500).json({ error: 'Failed to list ISO files' });
    }
});


// Upload ISO route
router.post('/upload-iso', upload.single('iso'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No ISO file uploaded.' });
        }

        res.json({
            message: `✅ ISO "${req.file.originalname}" uploaded successfully.`,
            file: {
                name: req.file.originalname,
                size: `${(req.file.size / (1024 * 1024)).toFixed(2)} MB`
            }
        });
    } catch (err) {
        console.error('❌ Error uploading ISO file:', err.message);
        res.status(500).json({ error: 'Failed to upload ISO file.' });
    }
});


// Upload ISO file - Additional endpoint that accepts base64 content
router.post('/upload-iso-base64', (req, res) => {
    try {
        const { name, content } = req.body;

        if (!name || !content) {
            return res.status(400).json({ error: 'Name and content are required' });
        }

        if (!name.toLowerCase().endsWith('.iso')) {
            return res.status(400).json({ error: 'Only ISO files are allowed' });
        }

        const buffer = Buffer.from(content, 'base64');
        const filePath = path.join(ISO_DIR, name);

        fs.writeFileSync(filePath, buffer);

        res.json({
            message: `ISO file ${name} uploaded successfully`,
            file: {
                name,
                size: `${(buffer.length / (1024 * 1024)).toFixed(2)} MB`
            }
        });
    } catch (err) {
        console.error('Error uploading ISO file via base64:', err);
        res.status(500).json({ error: 'Failed to upload ISO file' });
    }
});

// Delete ISO file
router.delete('/delete-iso/:filename', (req, res) => {
    const filename = req.params.filename;
    const isoPath = path.join(ISO_DIR, filename);

    if (!fs.existsSync(isoPath)) {
        return res.status(404).json({ error: 'ISO file not found' });
    }

    try {
        fs.unlinkSync(isoPath);
        res.json({ message: `ISO file ${filename} deleted successfully` });
    } catch (err) {
        console.error(`Error deleting ISO file ${filename}:`, err);
        res.status(500).json({ error: `Failed to delete ISO file: ${err.message}` });
    }
});

// Create Disk
router.post('/create-disk', (req, res) => {
    let { name, size, format, type = 'dynamic' } = req.body;

    format = format.toLowerCase();
    type = type.toLowerCase();

    if (!name || !size || !format || !SUPPORTED_FORMATS.includes(format)) {
        return res.status(400).json({ error: `Invalid or missing disk parameters. Supported formats: ${SUPPORTED_FORMATS.join(', ')}` });
    }

    const filePath = path.join(DISK_DIR, `${name}.${format}`);
    const isWindows = os.platform() === 'win32';
    let options = '';

    switch (format) {
        case 'qcow2':
            if (type === 'fixed') {
                if (isWindows) {
                    console.warn(`⚠️ Skipping preallocation=full on Windows`);
                    options = '-o preallocation=metadata'; // fallback
                } else {
                    options = '-o preallocation=full';
                }
            } else {
                options = '-o preallocation=metadata';
            }
            break;

        case 'vmdk':
            options = type === 'fixed' ? '-o subformat=monolithicFlat' : '-o subformat=streamOptimized';
            break;

        case 'raw':
            if (type === 'dynamic') {
                return res.status(400).json({
                    error: `'raw' format does not support dynamic disks. Use 'fixed' or omit the type.`
                });
            }
            break;

        case 'vdi':
        case 'vpc':
            if (type === 'fixed') {
                return res.status(400).json({
                    error: `'${format}' format does not support fixed disks. Only dynamic allocation is supported.`
                });
            }
            break;
    }

    const command = `qemu-img create -f ${format} ${options} "${filePath}" ${size}G`;

    exec(command, (err, stdout, stderr) => {
        if (err) {
            console.error(`Error creating disk: ${stderr}`);
            return res.status(500).json({ error: stderr });
        }
        console.log(`✅ Disk created: ${stdout}`);
        res.json({ message: `✅ Disk "${name}.${format}" created successfully` });
    });
});

// CREATE VM
router.post('/create-vm', (req, res) => {
    const { name, cpus, memory, diskSize, diskFormat, os, iso, networkType, enableKVM, enableEFI, customArgs } = req.body;

    if (!name || !cpus || !memory || !diskSize || !diskFormat) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Create disk for the VM
    const diskName = `${name}-disk`;
    const diskPath = path.join(DISK_DIR, `${diskName}.${diskFormat}`);

    try {
        // Create the disk first
        const diskCommand = `qemu-img create -f ${diskFormat} ${diskPath} ${diskSize}G`;
        execSync(diskCommand);

        // Prepare VM arguments
        const args = [
            '-name', name,
            '-smp', cpus.toString(),
            '-m', `${memory}G`,
            '-drive', `file=${diskPath},format=${diskFormat},if=virtio`
        ];

        // Add ISO if specified
        if (iso) {
            const isoPath = path.join(ISO_DIR, iso);
            if (fs.existsSync(isoPath)) {
                args.push('-cdrom', isoPath);
                args.push('-boot', 'order=d');
            } else {
                return res.status(404).json({ error: 'ISO file not found' });
            }
        }

        // Add network configuration
        if (networkType === 'user') {
            args.push('-net', 'nic,model=virtio', '-net', 'user');
        } else if (networkType === 'bridge') {
            const bridge = req.body.networkBridge || 'br0';
            args.push('-net', 'nic,model=virtio', '-net', `bridge,br=${bridge}`);
        }

        // Add KVM support if requested
        if (enableKVM) {
            args.push('-enable-kvm');
        }

        // Add EFI support if requested
        if (enableEFI) {
            args.push('-bios', '/usr/share/ovmf/OVMF.fd');
        }

        // Add custom arguments if provided
        if (customArgs) {
            args.push(...customArgs.split(' '));
        }

        // Start VM using spawn so we can get its PID
        const qemuProcess = spawn('qemu-system-x86_64', args, {
            detached: true,
            stdio: 'ignore' // prevent it from blocking
        });

        // Detach from parent and let the process live
        qemuProcess.unref();

        const vmConfig = {
            id: Date.now().toString(),
            name,
            cpus,
            memory: `${memory} GB`,
            storage: `${diskSize} GB`,
            os: os || 'Custom OS',
            status: 'running',
            diskName,
            diskFormat,
            iso: iso || null,
            pid: qemuProcess.pid,
            networkType,
            startedAt: new Date().toISOString()
        };

        const vmPath = path.join(VM_DIR, `${name}.json`);
        fs.writeFileSync(vmPath, JSON.stringify(vmConfig, null, 2));

        console.log(`✅ VM "${name}" started with PID ${qemuProcess.pid}`);
        res.json({
            message: `🖥️ VM "${name}" started successfully`,
            vm: vmConfig
        });
    } catch (err) {
        console.error(`Error creating VM: ${err.message}`);
        res.status(500).json({ error: `Failed to create VM: ${err.message}` });
    }
});

// LIST VMs
router.get('/vms', (req, res) => {
    console.log('GET /vms - Reading VMs from directory:', VM_DIR);

    try {
        // Check if directory exists first
        if (!fs.existsSync(VM_DIR)) {
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

                const fileContent = fs.readFileSync(vmPath, 'utf8');
                const vmData = JSON.parse(fileContent);

                // Check if VM is still running (if it has a PID)
                if (vmData.pid) {
                    try {
                        // This will throw if process doesn't exist
                        process.kill(vmData.pid, 0);
                        vmData.status = 'running';

                        // Calculate uptime if VM is running
                        if (vmData.startedAt) {
                            const startTime = new Date(vmData.startedAt).getTime();
                            const currentTime = new Date().getTime();
                            const uptimeMs = currentTime - startTime;

                            // Format uptime
                            const seconds = Math.floor(uptimeMs / 1000) % 60;
                            const minutes = Math.floor(uptimeMs / (1000 * 60)) % 60;
                            const hours = Math.floor(uptimeMs / (1000 * 60 * 60)) % 24;
                            const days = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));

                            if (days > 0) {
                                vmData.uptime = `${days} day${days !== 1 ? 's' : ''}, ${hours} hour${hours !== 1 ? 's' : ''}`;
                            } else if (hours > 0) {
                                vmData.uptime = `${hours} hour${hours !== 1 ? 's' : ''}, ${minutes} minute${minutes !== 1 ? 's' : ''}`;
                            } else {
                                vmData.uptime = `${minutes} minute${minutes !== 1 ? 's' : ''}, ${seconds} second${seconds !== 1 ? 's' : ''}`;
                            }
                        }
                    } catch (e) {
                        // Process doesn't exist
                        console.log(`VM ${vmData.name} process not found, marking as stopped`);
                        vmData.status = 'stopped';
                        vmData.uptime = undefined;
                    }
                }

                return vmData;
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
        if (!fs.existsSync(VM_DIR)) {
            return res.status(404).json({ error: 'VM directory not found' });
        }

        const files = fs.readdirSync(VM_DIR).filter(file => file.endsWith('.json'));

        for (const file of files) {
            const vmPath = path.join(VM_DIR, file);
            const vmData = JSON.parse(fs.readFileSync(vmPath, 'utf8'));

            if (vmData.id === vmId) {
                // Check VM status
                if (vmData.pid) {
                    try {
                        process.kill(vmData.pid, 0);
                        vmData.status = 'running';

                        // Calculate uptime
                        if (vmData.startedAt) {
                            const startTime = new Date(vmData.startedAt).getTime();
                            const currentTime = new Date().getTime();
                            const uptimeMs = currentTime - startTime;

                            // Format uptime
                            const seconds = Math.floor(uptimeMs / 1000) % 60;
                            const minutes = Math.floor(uptimeMs / (1000 * 60)) % 60;
                            const hours = Math.floor(uptimeMs / (1000 * 60 * 60)) % 24;
                            const days = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));

                            if (days > 0) {
                                vmData.uptime = `${days} day${days !== 1 ? 's' : ''}, ${hours} hour${hours !== 1 ? 's' : ''}`;
                            } else if (hours > 0) {
                                vmData.uptime = `${hours} hour${hours !== 1 ? 's' : ''}, ${minutes} minute${minutes !== 1 ? 's' : ''}`;
                            } else {
                                vmData.uptime = `${minutes} minute${minutes !== 1 ? 's' : ''}, ${seconds} second${seconds !== 1 ? 's' : ''}`;
                            }
                        }
                    } catch (e) {
                        vmData.status = 'stopped';
                        vmData.uptime = undefined;
                    }
                }

                console.log(`Found VM ${vmId}:`, vmData);
                return res.json(vmData);
            }
        }

        console.log(`VM ${vmId} not found`);
        res.status(404).json({ error: 'VM not found' });
    } catch (err) {
        console.error(`Error getting VM details for ${vmId}:`, err);
        res.status(500).json({ error: `Failed to get VM details: ${err.message}` });
    }
});

// LIST DISKS
router.get('/list-disks', (req, res) => {
    const files = fs.readdirSync(DISK_DIR).filter(file => !file.startsWith('.'));
    const diskInfoList = [];

    for (const file of files) {
        const filePath = path.join(DISK_DIR, file);
        try {
            const output = execSync(`qemu-img info "${filePath}"`).toString();

            const sizeMatch = output.match(/virtual size:.*\((\d+) bytes\)/);
            const formatMatch = output.match(/file format: (\w+)/);
            const preallocMatch = output.match(/preallocation: (\w+)/);
            const subformatMatch = output.match(/subformat: (\w+)/);

            const sizeBytes = sizeMatch ? parseInt(sizeMatch[1]) : 0;
            const sizeGB = Math.round(sizeBytes / (1024 * 1024 * 1024));
            const format = formatMatch ? formatMatch[1] : 'unknown';

            // Infer type
            let type = 'dynamic';
            if (format === 'qcow2') {
                type = preallocMatch ?.[1] === 'full' ? 'fixed' : 'dynamic';
            } else if (format === 'vmdk') {
                type = subformatMatch ?.[1] === 'monolithicFlat' ? 'fixed' : 'dynamic';
            } else if (format === 'raw') {
                type = 'fixed';
            }

            diskInfoList.push({
                name: file.replace(/\.\w+$/, ''), // strip extension
                size: sizeGB.toString(),
                format,
                type
            });

        } catch (err) {
            console.error(`❌ Failed to read info for ${file}:`, err.message);
            // You can choose to skip or push a minimal record
        }
    }

    res.json(diskInfoList);
});

// DELETE VM
router.delete('/vms/:id', (req, res) => {
    const vmId = req.params.id;

    try {
        let vmFilePath = null;
        let vmData = null;

        // Find the VM file by ID
        const files = fs.readdirSync(VM_DIR).filter(file => file.endsWith('.json'));
        for (const file of files) {
            const data = JSON.parse(fs.readFileSync(path.join(VM_DIR, file)));
            if (data.id === vmId) {
                vmFilePath = path.join(VM_DIR, file);
                vmData = data;
                break;
            }
        }

        if (!vmFilePath || !vmData) {
            return res.status(404).json({ error: 'VM not found' });
        }

        // Try to kill the process if it's running
        let killed = false;
        if (vmData.pid) {
            try {
                // Check if process exists (this throws if it doesn't)
                process.kill(vmData.pid, 0);
                process.kill(vmData.pid); // Kill it for real
                killed = true;
            } catch (e) {
                console.warn(`⚠️ VM process PID ${vmData.pid} already not running.`);
            }
        }

        // Delete the VM config file
        fs.unlinkSync(vmFilePath);

        // Delete VM disk if requested
        const removeDisks = req.query.removeDisks === 'true';
        if (removeDisks && vmData.diskName && vmData.diskFormat) {
            const diskPath = path.join(DISK_DIR, `${vmData.diskName}.${vmData.diskFormat}`);
            if (fs.existsSync(diskPath)) {
                fs.unlinkSync(diskPath);
            }
        }

        res.json({
            message: `VM "${vmData.name}" deleted${killed ? '' : ' (process was already stopped)'}.`,
            removedDisk: removeDisks
        });
    } catch (err) {
        console.error(`Error deleting VM:`, err);
        res.status(500).json({ error: `Failed to delete VM: ${err.message}` });
    }
});

// DELETE DISK
router.delete('/delete-disk/:filename', (req, res) => {
    const filename = req.params.filename;
    const diskPath = path.join(DISK_DIR, filename);

    // Check if the disk file exists
    if (!fs.existsSync(diskPath)) {
        return res.status(404).json({ error: `Disk "${filename}" not found.` });
    }

    try {
        fs.unlinkSync(diskPath);
        res.json({ message: `🧹 Disk "${filename}" deleted successfully.` });
    } catch (err) {
        console.error(`❌ Failed to delete disk "${filename}":`, err.message);
        res.status(500).json({ error: `Failed to delete disk: ${err.message}` });
    }
});

// UPDATE DISK
router.put('/update-disk/:filename', (req, res) => {
    const oldFilename = req.params.filename;
    const { name, size } = req.body;

    if (!name && !size) {
        return res.status(400).json({ error: 'You must provide at least a new name or new size.' });
    }

    const oldPath = path.join(DISK_DIR, oldFilename);
    if (!fs.existsSync(oldPath)) {
        return res.status(404).json({ error: `Disk "${oldFilename}" not found.` });
    }

    const ext = path.extname(oldFilename).replace('.', '').toLowerCase();
    const currentName = path.basename(oldFilename, `.${ext}`);
    const newFilename = `${name || currentName}.${ext}`;
    const newPath = path.join(DISK_DIR, newFilename);

    // Step 1: Rename if needed
    if (name && newFilename !== oldFilename) {
        try {
            if (fs.existsSync(newPath)) {
                return res.status(409).json({ error: `A disk named "${newFilename}" already exists.` });
            }
            fs.renameSync(oldPath, newPath);
        } catch (err) {
            return res.status(500).json({ error: `Failed to rename disk: ${err.message}` });
        }
    }

    // Step 2: Resize if needed
    if (size) {
        if (!RESIZE_SUPPORTED_FORMATS.includes(ext)) {
            return res.status(400).json({
                error: `Resize not supported for format "${ext}". Supported formats: ${RESIZE_SUPPORTED_FORMATS.join(', ')}`
            });
        }

        try {
            const output = execSync(`qemu-img info "${newPath}"`).toString();
            const sizeMatch = output.match(/virtual size:.*\((\d+) bytes\)/);
            const currentSizeBytes = sizeMatch ? parseInt(sizeMatch[1]) : 0;
            const currentSizeGB = Math.ceil(currentSizeBytes / (1024 * 1024 * 1024));
            const requestedSize = parseInt(size);

            if (requestedSize > currentSizeGB) {
                execSync(`qemu-img resize "${newPath}" ${requestedSize}G`);
                return res.json({
                    message: `✅ Disk "${newFilename}" resized from ${currentSizeGB}G to ${requestedSize}G.`
                });
            } else if (!name) {
                return res.status(400).json({
                    error: `New size must be greater than current size (${currentSizeGB}G).`
                });
            }
        } catch (err) {
            return res.status(500).json({ error: `Failed to resize disk: ${err.message}` });
        }
    }

    res.json({ message: `✅ Disk "${oldFilename}" successfully renamed to "${newFilename}".` });
});

const getVMData = (vmId) => {
    const files = fs.readdirSync(VM_DIR).filter(f => f.endsWith('.json'));
    for (const file of files) {
        const fullPath = path.join(VM_DIR, file);
        const data = JSON.parse(fs.readFileSync(fullPath));
        if (data.id === vmId) return { path: fullPath, data };
    }
    return null;
};

router.post('/vms/:id/stop', (req, res) => {
    const vm = getVMData(req.params.id);
    if (!vm) return res.status(404).json({ error: 'VM not found' });
    try {
        process.kill(vm.data.pid);
        vm.data.status = 'stopped';
        fs.writeFileSync(vm.path, JSON.stringify(vm.data, null, 2));
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
        fs.writeFileSync(vm.path, JSON.stringify(vm.data, null, 2));
        res.json({ message: `⏸️ VM "${vm.data.name}" paused.` });
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
            const isoPath = path.join(__dirname, 'iso', vm.data.iso);
            args.push('-cdrom', isoPath, '-boot', 'order=d');
        }
        const proc = spawn('qemu-system-x86_64', args, { detached: true, stdio: 'ignore' });
        proc.unref();
        vm.data.pid = proc.pid;
        vm.data.status = 'running';
        fs.writeFileSync(vm.path, JSON.stringify(vm.data, null, 2));
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
    fs.writeFileSync(vm.path, JSON.stringify(vm.data, null, 2));
    res.json({ message: `✏️ VM "${vm.data.name}" updated.`, vm: vm.data });
});

// MIGRATE (simulation)
router.post('/vms/:id/migrate', (req, res) => {
    res.json({ message: '🚀 VM migration is not yet implemented. Requires cluster setup.' });
});

// DELETE VM
router.delete('/vms/:id', (req, res) => {
    const vm = getVMData(req.params.id);
    if (!vm) return res.status(404).json({ error: 'VM not found' });

    try {
        try { process.kill(vm.data.pid); } catch {}
        fs.unlinkSync(vm.path);
        const diskFile = path.join(DISK_DIR, `${vm.data.diskName}.${vm.data.diskFormat}`);
        if (fs.existsSync(diskFile)) fs.unlinkSync(diskFile);
        res.json({ message: `🗑️ VM "${vm.data.name}" deleted.` });
    } catch (e) {
        res.status(500).json({ error: `Failed to delete VM: ${e.message}` });
    }
});

// Add a new health check endpoint
router.get('/status', (req, res) => {
    try {
        // Check if directories exist
        const dirs = [VM_DIR, DISK_DIR, ISO_DIR, SNAPSHOT_DIR];
        const dirStatus = dirs.map(dir => ({
            path: dir,
            exists: fs.existsSync(dir)
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