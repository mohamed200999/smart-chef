import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = path.resolve('./');
const DATA_DIR = path.join(ROOT, 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(ROOT));

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(PRODUCTS_FILE)) {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify([], null, 2), 'utf8');
  }
}

function loadProducts() {
  try {
    ensureDataDir();
    const content = fs.readFileSync(PRODUCTS_FILE, 'utf8');
    return JSON.parse(content || '[]');
  } catch (err) {
    console.error('Failed to load products:', err);
    return [];
  }
}

function saveProducts(products) {
  try {
    ensureDataDir();
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Failed to save products:', err);
    return false;
  }
}

app.get('/api/products', (req, res) => {
  return res.json(loadProducts());
});

app.get('/api/products/:id', (req, res) => {
  const products = loadProducts();
  const product = products.find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ message: 'Not found' });
  return res.json(product);
});

app.post('/api/products', (req, res) => {
  const data = req.body;
  if (!data || !data.id) {
    return res.status(400).json({ message: 'Product id is required' });
  }
  const products = loadProducts();
  const idx = products.findIndex((p) => p.id === data.id);
  if (idx >= 0) {
    products[idx] = { ...products[idx], ...data };
  } else {
    products.push(data);
  }
  saveProducts(products);
  return res.status(200).json({ ok: true, product: data });
});

app.put('/api/products/:id', (req, res) => {
  const data = req.body;
  const products = loadProducts();
  const idx = products.findIndex((p) => p.id === req.params.id);
  if (idx < 0) return res.status(404).json({ message: 'Not found' });
  products[idx] = { ...products[idx], ...data, id: req.params.id };
  saveProducts(products);
  return res.json({ ok: true, product: products[idx] });
});

app.delete('/api/products/:id', (req, res) => {
  const products = loadProducts();
  const next = products.filter((p) => p.id !== req.params.id);
  if (next.length === products.length) {
    return res.status(404).json({ message: 'Not found' });
  }
  saveProducts(next);
  return res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Smart Chef server running at http://localhost:${PORT}`);
});
