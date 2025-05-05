
import express from 'express';
import fs from 'fs';
import path from 'path';
import { ISO_DIR } from '../index.js';

const router = express.Router();

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
router.post('/upload-iso', (req, res) => {
  try {
    if (!req.body || !req.body.name || !req.body.content) {
      return res.status(400).json({ error: 'Missing ISO name or content.' });
    }
    const isoPath = path.join(ISO_DIR, req.body.name);
    fs.writeFileSync(isoPath, Buffer.from(req.body.content, 'base64'));
    res.json({ message: `ISO ${req.body.name} uploaded.` });
  } catch (e) {
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

export default router;
