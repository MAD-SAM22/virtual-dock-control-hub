
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import qemuRouter from './qemuServer.js';

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

// Mount the QEMU router
app.use('/qemu', qemuRouter);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`QEMU API available at http://localhost:${PORT}/qemu`);
});

export default app;
