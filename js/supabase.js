/* Remote backend helper for shared product persistence */
window.API_BASE_URL = '';
window.API_ENABLED = true;
window.SUPABASE_ENABLED = false;
window.SUPABASE_CLIENT = null;

function apiUrl(path) {
  if (typeof path !== 'string') return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return (window.API_BASE_URL || '') + path;
}

async function apiFetch(path, options = {}) {
  const url = apiUrl(path);
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json'
    },
    ...options
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }

  return res.status === 204 ? null : res.json();
}

window.fetchRemoteProducts = async function () {
  if (!window.API_ENABLED) return [];
  try {
    return await apiFetch('/api/products');
  } catch (err) {
    console.warn('API fetchRemoteProducts failed', err);
    return [];
  }
};

window.upsertRemoteProduct = async function (product) {
  if (!window.API_ENABLED) return false;
  try {
    await apiFetch('/api/products', {
      method: 'POST',
      body: JSON.stringify({
        ...product,
        stock: product.stock || {}
      })
    });
    return true;
  } catch (err) {
    console.warn('API upsertRemoteProduct failed', err);
    return false;
  }
};

window.deleteRemoteProduct = async function (id) {
  if (!window.API_ENABLED) return false;
  try {
    await apiFetch(`/api/products/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    return true;
  } catch (err) {
    console.warn('API deleteRemoteProduct failed', err);
    return false;
  }
};

window.initRemoteProducts = async function () {
  if (!window.API_ENABLED) return;
  const products = await window.fetchRemoteProducts();
  if (!products || !products.length) return;
  try {
    const defaultIds = new Set((window.DEFAULT_PRODUCTS || []).map((p) => p.id));
    const custom = [];
    const overrides = [];
    products.forEach((item) => {
      if (!item || !item.id) return;
      const product = {
        ...item,
        stock: typeof item.stock === 'string' ? JSON.parse(item.stock || '{}') : item.stock || {},
        price: Number(item.price || 0),
        available: item.available !== false
      };
      if (defaultIds.has(item.id)) {
        overrides.push(product);
      } else {
        custom.push(product);
      }
    });
    localStorage.setItem(STORAGE.products, JSON.stringify(custom));
    localStorage.setItem(STORAGE.productOverrides, JSON.stringify(overrides));
  } catch (err) {
    console.warn('API initRemoteProducts failed', err);
  }
};