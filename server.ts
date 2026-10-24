import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

app.use(express.json({ limit: '50mb' }));

// In-memory + file-backed shares cache
const sharesMap = new Map<string, any>();
const SHARES_FILE = path.join(process.cwd(), '.shares_cache.json');

try {
  if (fs.existsSync(SHARES_FILE)) {
    const raw = fs.readFileSync(SHARES_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    Object.entries(parsed).forEach(([k, v]) => sharesMap.set(k, v));
  }
} catch {
  // ignore
}

function persistShares() {
  try {
    const obj = Object.fromEntries(sharesMap.entries());
    fs.writeFileSync(SHARES_FILE, JSON.stringify(obj), 'utf-8');
  } catch {
    // ignore
  }
}

// Share API - save dataset snapshot
app.post('/api/share', (req, res) => {
  try {
    const { invoices, payments, vendorName, note } = req.body || {};
    if (!Array.isArray(invoices) && !Array.isArray(payments)) {
      return res.status(400).json({ error: 'Invalid payload: invoices or payments array required' });
    }

    const shareId = 'im_' + Math.random().toString(36).substring(2, 10);
    const shareData = {
      id: shareId,
      createdAt: new Date().toISOString(),
      vendorName: vendorName || invoices?.[0]?.vendorName || 'Instamart Vendor',
      invoices: invoices || [],
      payments: payments || [],
      note: note || '',
    };

    sharesMap.set(shareId, shareData);
    persistShares();

    return res.json({
      success: true,
      shareId,
      createdAt: shareData.createdAt,
      count: (shareData.invoices?.length || 0) + (shareData.payments?.length || 0),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to create share' });
  }
});

// Share API - get dataset snapshot
app.get('/api/share/:id', (req, res) => {
  const { id } = req.params;
  const shareData = sharesMap.get(id);
  if (!shareData) {
    return res.status(404).json({ error: 'Shared dataset not found or link expired' });
  }
  return res.json({ success: true, ...shareData });
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true, 
        host: HOST, 
        port: PORT,
        hmr: false,
        ws: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`Instamart Payment Tracker running on http://${HOST}:${PORT}`);
  });
}

startServer();
