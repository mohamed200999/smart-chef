/* Admin panel */
let previewDataUrl = null;

function showLogin() {
  document.getElementById('loginView').style.display = 'block';
  document.getElementById('adminPanel').style.display = 'none';
}

function showPanel() {
  document.getElementById('loginView').style.display = 'none';
  document.getElementById('adminPanel').style.display = 'block';
  renderCustomProducts();
  renderAllProducts();
  renderOrders();
  setAdminRoleLabel();
  toggleStoreProductsSection();
}

async function initAdmin() {
  await window.initRemoteProducts?.();
  if (isAdminLoggedIn()) showPanel();
  else showLogin();
}

initAdmin();

document.getElementById('loginForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const pass = document.getElementById('adminPass').value;
  const alert = document.getElementById('loginAlert');
  if (adminLogin(pass)) {
    alert.innerHTML = '';
    showPanel();
  } else {
    alert.innerHTML = '<div class="alert alert-error">كلمة المرور غير صحيحة</div>';
  }
});

document.getElementById('logoutBtn')?.addEventListener('click', () => {
  adminLogout();
  showLogin();
});

document.getElementById('prodImage')?.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    previewDataUrl = reader.result;
    document.getElementById('imagePreview').innerHTML =
      `<img src="${previewDataUrl}" alt="معاينة" />`;
  };
  reader.readAsDataURL(file);
});

document.getElementById('addSizeRow')?.addEventListener('click', () => {
  const row = document.createElement('div');
  row.className = 'sizes-input-row';
  row.style.cssText = 'display:flex;gap:0.5rem;margin-bottom:0.5rem';
  row.innerHTML = `
    <input type="text" placeholder="مقاس" class="size-name" style="flex:1" />
    <input type="number" placeholder="الكمية" class="size-qty" min="0" style="flex:1" />
    <button type="button" class="btn btn-ghost btn-sm remove-size">✕</button>
  `;
  row.querySelector('.remove-size').addEventListener('click', () => row.remove());
  document.getElementById('sizesInputs').appendChild(row);
});

function collectStockFromForm() {
  const stock = {};
  document.querySelectorAll('.sizes-input-row').forEach((row) => {
    const name = row.querySelector('.size-name')?.value.trim();
    const qty = parseInt(row.querySelector('.size-qty')?.value, 10);
    if (name && qty > 0) stock[name] = qty;
  });
  return stock;
}

document.getElementById('addProductForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const alert = document.getElementById('addAlert');
  const stock = collectStockFromForm();

  if (!previewDataUrl) {
    alert.innerHTML = '<div class="alert alert-error">يرجى رفع صورة المنتج</div>';
    return;
  }
  if (!Object.keys(stock).length) {
    alert.innerHTML = '<div class="alert alert-error">أضف مقاساً واحداً على الأقل مع كمية</div>';
    return;
  }

  adminAddProduct({
    nameAr: document.getElementById('prodName').value.trim(),
    category: document.getElementById('prodCategory').value,
    price: document.getElementById('prodPrice').value,
    descriptionAr: document.getElementById('prodDesc').value.trim(),
    image: previewDataUrl,
    stock
  });

  alert.innerHTML = '<div class="alert alert-success">تم إضافة المنتج بنجاح!</div>';
  e.target.reset();
  previewDataUrl = null;
  document.getElementById('imagePreview').innerHTML =
    '<span style="color:var(--text-muted);font-size:0.8rem">معاينة</span>';
  document.getElementById('sizesInputs').innerHTML = `
    <div class="sizes-input-row" style="display:flex;gap:0.5rem;margin-bottom:0.5rem">
      <input type="text" placeholder="مقاس (مثال: M)" class="size-name" style="flex:1" />
      <input type="number" placeholder="الكمية" class="size-qty" min="0" style="flex:1" />
    </div>
  `;
  renderCustomProducts();
  setTimeout(() => (alert.innerHTML = ''), 3000);
});

document.getElementById('clearOrdersBtn')?.addEventListener('click', () => {
  const alert = document.getElementById('addAlert');
  localStorage.setItem('smartchef_orders', JSON.stringify([]));
  renderOrders();
  alert.innerHTML = '<div class="alert alert-success">تم مسح الطلبات الأخيرة من الحفظ.</div>';
  setTimeout(() => (alert.innerHTML = ''), 3000);
});

function renderCustomProducts() {
  const list = document.getElementById('customProductsList');
  if (!list) return;
  const custom = loadCustomProducts();
  if (!custom.length) {
    list.innerHTML = '<p style="color:var(--text-muted)">لا توجد منتجات مضافة بعد.</p>';
    return;
  }
  list.innerHTML = custom
    .map(
      (p) => `
    <div class="admin-product-row" data-id="${p.id}">
      <img src="${p.image}" alt="" />
      <div class="info">
        <strong>${p.nameAr}</strong>
        <div style="font-size:0.85rem;color:var(--text-muted)">
          ${CATEGORIES[p.category]?.nameAr} — ${formatPrice(p.price)}
        </div>
        <div style="font-size:0.8rem;margin-top:0.25rem">المخزون: ${JSON.stringify(p.stock)}</div>
      </div>
      <button type="button" class="btn btn-ghost btn-sm delete-prod" data-id="${p.id}">حذف</button>
    </div>
  `
    )
    .join('');

  list.querySelectorAll('.delete-prod').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (confirm('حذف هذا المنتج؟')) {
        adminDeleteProduct(btn.dataset.id);
        renderCustomProducts();
      }
    });
  });
}

function getAdminRoleLabelText() {
  const role = getAdminRole();
  return role === 'manager'
    ? 'صلاحية تعديل منتجات المتجر'
    : 'صلاحية إدارة عامة';
}

function setAdminRoleLabel() {
  const el = document.getElementById('adminRoleLabel');
  if (!el) return;
  el.textContent = getAdminRoleLabelText();
}

function toggleStoreProductsSection() {
  const card = document.getElementById('storeProductsCard');
  if (!card) return;
  card.style.display = getAdminRole() === 'manager' ? 'block' : 'none';
}

function buildStockRows(stock) {
  const rows = Object.entries(stock || {}).map(
    ([size, qty]) => `
      <div class="sizes-input-row" style="display:flex;gap:0.5rem;margin-bottom:0.5rem">
        <input type="text" class="size-name" placeholder="مقاس" value="${size}" style="flex:1" />
        <input type="number" class="size-qty" placeholder="الكمية" min="0" value="${qty}" style="flex:1" />
        <button type="button" class="btn btn-ghost btn-sm remove-size">✕</button>
      </div>
    `
  );
  return rows.join('') || `
    <div class="sizes-input-row" style="display:flex;gap:0.5rem;margin-bottom:0.5rem">
      <input type="text" class="size-name" placeholder="مقاس" style="flex:1" />
      <input type="number" class="size-qty" placeholder="الكمية" min="0" style="flex:1" />
    </div>
  `;
}

function renderAllProducts() {
  const list = document.getElementById('allProductsList');
  if (!list) return;
  const products = getAllProducts();
  if (!products.length) {
    list.innerHTML = '<p style="color:var(--text-muted)">لا توجد منتجات لتعديلها.</p>';
    return;
  }

  list.innerHTML = products
    .map(
      (p) => `
      <div class="admin-product-row" data-id="${p.id}" style="margin-bottom:1rem;">
        <div style="display:flex;gap:0.75rem;align-items:flex-start;flex-wrap:wrap">
          <img src="${p.image}" alt="" style="width:90px;height:90px;object-fit:cover;border-radius:10px" />
          <div class="info" style="flex:1;min-width:220px">
            <strong>${p.nameAr}</strong>
            <div style="font-size:0.85rem;color:var(--text-muted);margin-top:0.25rem">
              ${CATEGORIES[p.category]?.nameAr || ''} — ${formatProductPriceLabel(p)}
            </div>
            <div style="font-size:0.8rem;margin-top:0.25rem">الحالة: ${p.available !== false ? 'متوفر' : 'غير متوفر'}</div>
            <div style="font-size:0.8rem;margin-top:0.25rem">المقاسات: ${JSON.stringify(p.stock)}</div>
          </div>
          <div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap">
            <button type="button" class="btn btn-ghost btn-sm edit-store-prod">تعديل</button>
            <button type="button" class="btn btn-outline btn-sm delete-store-prod" style="border-color:#ff4444;color:#ff4444">حذف</button>
          </div>
        </div>
        <div class="edit-panel hidden" style="margin-top:0.75rem;padding:0.75rem;border:1px solid var(--border);border-radius:10px;background:rgba(255,255,255,0.95)">
          <div class="form-group">
            <label>السعر (ج.م)</label>
            <input type="number" class="edit-price" min="0" value="${Number(p.price) || 0}" />
          </div>
          <div class="form-group">
            <label>الحالة</label>
            <select class="edit-available">
              <option value="true" ${p.available !== false ? 'selected' : ''}>متوفر</option>
              <option value="false" ${p.available === false ? 'selected' : ''}>غير متوفر</option>
            </select>
          </div>
          <div class="form-group">
            <label>المقاسات والكميات</label>
            <div class="sizes-edit-list">${buildStockRows(p.stock)}</div>
            <button type="button" class="btn btn-ghost btn-sm add-edit-size">+ مقاس</button>
          </div>
          <div style="display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center">
            <button type="button" class="btn btn-primary btn-sm save-store-prod">حفظ التعديل</button>
            <button type="button" class="btn btn-ghost btn-sm cancel-store-edit">إلغاء</button>
          </div>
        </div>
      </div>
    `
    )
    .join('');

  attachAllProductHandlers();
}

function attachAllProductHandlers() {
  document.querySelectorAll('.edit-store-prod').forEach((btn) => {
    btn.addEventListener('click', () => {
      const row = btn.closest('.admin-product-row');
      const panel = row.querySelector('.edit-panel');
      panel.classList.toggle('hidden');
    });
  });

  document.querySelectorAll('.add-edit-size').forEach((btn) => {
    btn.addEventListener('click', () => {
      const row = btn.closest('.admin-product-row');
      const sizesList = row.querySelector('.sizes-edit-list');
      const newRow = document.createElement('div');
      newRow.className = 'sizes-input-row';
      newRow.style.cssText = 'display:flex;gap:0.5rem;margin-bottom:0.5rem';
      newRow.innerHTML = `
        <input type="text" class="size-name" placeholder="مقاس" style="flex:1" />
        <input type="number" class="size-qty" placeholder="الكمية" min="0" style="flex:1" />
        <button type="button" class="btn btn-ghost btn-sm remove-size">✕</button>
      `;
      sizesList.appendChild(newRow);
      newRow.querySelector('.remove-size').addEventListener('click', () => newRow.remove());
    });
  });

  document.querySelectorAll('.save-store-prod').forEach((btn) => {
    btn.addEventListener('click', () => {
      const row = btn.closest('.admin-product-row');
      const id = row.dataset.id;
      const price = Number(row.querySelector('.edit-price').value) || 0;
      const available = row.querySelector('.edit-available').value === 'true';
      const stock = {};

      row.querySelectorAll('.sizes-input-row').forEach((sizeRow) => {
        const size = sizeRow.querySelector('.size-name')?.value.trim();
        const qty = Number(sizeRow.querySelector('.size-qty')?.value);
        if (size) stock[size] = Math.max(0, qty);
      });

      if (!Object.keys(stock).length) {
        document.getElementById('allProductsAlert').innerHTML = '<div class="alert alert-error">أضف مقاساً واحداً على الأقل مع كمية</div>';
        return;
      }

      if (!adminUpdateProduct(id, { price, available, stock })) {
        document.getElementById('allProductsAlert').innerHTML = '<div class="alert alert-error">حدث خطأ أثناء حفظ التعديل</div>';
        return;
      }

      document.getElementById('allProductsAlert').innerHTML = '<div class="alert alert-success">تم حفظ التعديل بنجاح</div>';
      renderAllProducts();
      renderCustomProducts();
      setTimeout(() => {
        document.getElementById('allProductsAlert').innerHTML = '';
      }, 3000);
    });
  });

  document.querySelectorAll('.delete-store-prod').forEach((btn) => {
    btn.addEventListener('click', () => {
      const row = btn.closest('.admin-product-row');
      const id = row.dataset.id;
      if (!confirm('هل تريد حذف هذا المنتج من الصفحة؟')) return;
      if (!adminDeleteStoreProduct(id)) {
        document.getElementById('allProductsAlert').innerHTML = '<div class="alert alert-error">لم يتم حذف المنتج</div>';
        return;
      }
      document.getElementById('allProductsAlert').innerHTML = '<div class="alert alert-success">تم حذف المنتج من الصفحة</div>';
      renderAllProducts();
      renderCustomProducts();
      setTimeout(() => {
        document.getElementById('allProductsAlert').innerHTML = '';
      }, 3000);
    });
  });

  document.querySelectorAll('.cancel-store-edit').forEach((btn) => {
    btn.addEventListener('click', () => {
      const panel = btn.closest('.edit-panel');
      panel.classList.add('hidden');
    });
  });
}

function renderOrders() {
  const el = document.getElementById('ordersList');
  if (!el) return;
  let orders = [];
  try {
    orders = JSON.parse(localStorage.getItem('smartchef_orders') || '[]');
  } catch { /* ignore */ }

  if (!orders.length) {
    el.innerHTML = '<p style="color:var(--text-muted)">لا توجد طلبات بعد.</p>';
    return;
  }

  el.innerHTML = orders
    .slice(0, 15)
    .map(
      (o) => `
    <div class="admin-product-row" style="flex-direction:column;align-items:flex-start;gap:0.35rem">
      <strong>${o.id}</strong>
      <span style="font-size:0.85rem">${new Date(o.date).toLocaleString('ar-EG')} — ${o.status || ''}</span>
      <span>${o.customer?.name} — ${o.customer?.phone}</span>
      <span style="font-size:0.85rem">${o.customer?.email || ''} | بديل: ${o.customer?.altPhone || '—'}</span>
      <span style="font-size:0.85rem">محافظة: ${o.customer?.governorateName || o.customer?.governorate || '—'} — ${o.customer?.address || ''}</span>
      <span style="font-size:0.85rem">شحن: ${formatPrice(o.shippingFee || 0)} — منتجات: ${formatPrice(o.subtotal ?? o.total)}</span>
      <span style="color:var(--orange)">إجمالي ${formatPrice(o.total)} — عربون ${formatPrice(o.depositRequired || 0)} — باقي ${formatPrice(o.remainder ?? o.total)}</span>
      <span style="font-size:0.8rem;color:var(--text-muted)">${o.items?.length || 0} منتج — دفع: ${o.paymentStatus || '—'}</span>
      ${o.receiptImage ? `<img src="${o.receiptImage}" alt="إيصال" style="max-width:120px;border-radius:8px;margin-top:0.35rem" />` : ''}
    </div>
  `
    )
    .join('');
}
