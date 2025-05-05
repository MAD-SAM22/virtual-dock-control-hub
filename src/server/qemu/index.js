
import express from 'express';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Import route handlers
import isoRoutes from './routes/isoRoutes.js';
import diskRoutes from './routes/diskRoutes.js';
import vmRoutes from './routes/vmRoutes.js';
import statusRoutes from './routes/statusRoutes.js';
import { ensureDirectories } from './utils/fileSystem.js';

const router = express.Router();

// Increase the JSON body size limit for base64-encoded files
router.use(bodyParser.json({ limit: '500000mb' }));
router.use(bodyParser.urlencoded({ extended: true, limit: '500000mb' }));

// Define directories
// Get current file path (using ES module approach)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define directories (in the same directory as this file)
export const DISK_DIR = path.resolve(__dirname, '../disks');
export const ISO_DIR = path.resolve(__dirname, '../iso');
export const VM_DIR = path.resolve(__dirname, '../vms');
export const SNAPSHOT_DIR = path.join(__dirname, '../snapshots');

// Create directories if they don't exist
ensureDirectories([DISK_DIR, ISO_DIR, VM_DIR, SNAPSHOT_DIR]);

// Register routes
router.use('/', isoRoutes);
router.use('/', diskRoutes);
router.use('/', vmRoutes);
router.use('/', statusRoutes);

export default router;
