/* Home page — render products & cart UI */
function showToast(message, type = 'success') {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = message;
  el.className = 'toast show ' + type;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => el.classList.remove('show'), 2800);
}

function updateCartBadge() {
  const badge = document.getElementById('cartBadge');
  if (!badge) return;
  const n = getCartCount();
  badge.textContent = n;
  badge.classList.toggle('hidden', n === 0);
}

function getSelectedQuickSize(card) {
  const hidden = card.querySelector('.quick-size-value');
  if (hidden) return hidden.value;
  const sel = card.querySelector('.quick-size-btn.selected');
  return sel?.dataset.size || card.querySelector('.quick-size-btn')?.dataset.size;
}

function renderProductCard(product) {
  const total = getTotalStock(product);
  const outOfStock = total === 0;
  const unavailable = product.available === false;
  const href = `product.html?id=${encodeURIComponent(product.id)}`;
  const favOn = isFavorite(product.id);
  const sizes = getAvailableSizes(product);
  const priceLabel = formatProductPriceLabel(product);

  const sizesHtml =
    sizes.length > 1
      ? `<div class="quick-sizes" data-product="${product.id}">
          ${sizes
            .map(
              (s, i) =>
                `<button type="button" class="quick-size-btn ${i === 0 ? 'selected' : ''}" data-size="${s}">${s}</button>`
            )
            .join('')}
        </div>`
      : sizes.length === 1
        ? `<input type="hidden" class="quick-size-value" value="${sizes[0]}" />`
        : '';

  return `
    <article class="product-card ${outOfStock || unavailable ? 'unavailable' : ''}" data-id="${product.id}">
      <a class="product-card-link" href="${href}">
        <div class="product-image-wrap">
          <button type="button" class="fav-btn ${favOn ? 'active' : ''}" data-id="${product.id}" aria-label="إضافة للمفضلة" aria-pressed="${favOn}">♥</button>
          <img src="${product.image}" alt="${product.nameAr}" loading="lazy" />
          ${outOfStock ? '<span class="badge-unavailable">نفد المخزون</span>' : ''}
        </div>
        <div class="product-info">
          <h3 class="product-name">${product.nameAr}</h3>
          <p class="product-price">${priceLabel}</p>
          ${unavailable ? '<p class="product-status">سيتوفر قريباً</p>' : ''}
        </div>
      </a>
      ${
        !outOfStock && !unavailable
          ? `
        <div class="product-card-actions">
          ${sizesHtml}
          <button type="button" class="btn btn-primary btn-sm btn-block quick-add-btn" data-id="${product.id}">🛒 أضف للسلة</button>
          <a href="${href}" class="btn btn-outline btn-sm btn-block">عرض التفاصيل</a>
        </div>
      `
          : ''
      }
    </article>
  `;
}

function renderUnavailableCard(item) {
  return `
    <article class="product-card unavailable">
      <div class="product-card-link">
        <div class="product-image-wrap" style="background:linear-gradient(135deg,#1a1a1a,#2a2a2a)">
          <span class="badge-unavailable">غير متوفر حالياً</span>
        </div>
        <div class="product-info">
          <h3 class="product-name">${item.nameAr}</h3>
          <p class="product-price" style="color:var(--text-muted)">قريباً</p>
        </div>
      </div>
    </article>
  `;
}

function renderCategoryNav() {
  const products = getAllProductsWithStock();

  const chips = document.getElementById('categoryChips');
  if (chips) {
    chips.innerHTML = Object.values(CATEGORIES)
      .map((cat) => {
        const n = products.filter((p) => p.category === cat.id && getTotalStock(p) > 0).length;
        const countLabel = n > 0 ? ` · ${n}` : '';
        return `<a href="#${cat.id}" class="category-chip">${cat.icon} ${cat.nameAr}${countLabel}</a>`;
      })
      .join('');
  }

  document.querySelectorAll('[data-section-chip]').forEach((el) => {
    const cat = el.dataset.sectionChip;
    const n = products.filter((p) => p.category === cat && getTotalStock(p) > 0).length;
    el.href = `#${cat}`;
    if (n > 0) {
      el.textContent = `عرض ${n}`;
      el.title = `انتقل لقسم ${CATEGORIES[cat]?.nameAr}`;
    } else if (cat === 'pants' || cat === 'toques') {
      el.textContent = 'قريباً';
      el.classList.add('section-chip--muted');
    } else {
      el.textContent = '';
      el.style.display = 'none';
    }
  });
}

function bindProductCardActions() {
  document.querySelectorAll('.fav-btn[data-id]').forEach(bindFavoriteButton);

  document.querySelectorAll('.quick-size-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const wrap = btn.closest('.quick-sizes');
      wrap.querySelectorAll('.quick-size-btn').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });

  document.querySelectorAll('.quick-add-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const card = btn.closest('.product-card');
      const id = btn.dataset.id;
      const size = getSelectedQuickSize(card);
      if (!size) {
        showToast('اختر المقاس', 'error');
        return;
      }
      const res = addToCart(id, size, 1);
      showToast(res.message, res.ok ? 'success' : 'error');
      if (res.ok) updateCartBadge();
    });
  });

  document.querySelectorAll('.fav-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  });
}

function renderCategoryGrids() {
  const products = getAllProductsWithStock();
  document.querySelectorAll('[data-category]').forEach((grid) => {
    const cat = grid.dataset.category;
    const items = products.filter((p) => p.category === cat);

    if (cat === 'pants' || cat === 'toques' || cat === 'soap') {
      const placeholders = PLACEHOLDER_UNAVAILABLE.filter((p) => p.category === cat);
      grid.innerHTML =
        items.map((p) => renderProductCard(p)).join('') +
        placeholders.map(renderUnavailableCard).join('');
      if (!items.length && !placeholders.length) {
        grid.innerHTML = renderUnavailableCard({ nameAr: 'قريباً' });
      }
      return;
    }

    grid.innerHTML = items.length
      ? items.map((p) => renderProductCard(p)).join('')
      : '<p style="color:var(--text-muted);grid-column:1/-1">لا توجد منتجات في هذا القسم.</p>';
  });

  bindProductCardActions();
  renderCategoryNav();
}

function renderCartDrawer() {
  const container = document.getElementById('cartItems');
  const totalEl = document.getElementById('cartTotal');
  if (!container) return;

  const cart = loadCart();
  if (!cart.length) {
    container.innerHTML = '<div class="cart-empty"><p>السلة فارغة</p><p>أضف منتجات من المتجر</p></div>';
    if (totalEl) totalEl.textContent = formatPrice(0);
    return;
  }

  container.innerHTML = cart
    .map((item) => {
      const p = getProductByIdWithStock(item.productId);
      if (!p) return '';
      const line = getCartLineTotal(item);
      const unit = getProductUnitPrice(p, item.size);
      return `
        <div class="cart-item" data-id="${item.productId}" data-size="${item.size}">
          <img src="${p.image}" alt="" />
          <div class="cart-item-info">
            <div class="cart-item-name">${p.nameAr}</div>
            <div class="cart-item-meta">المقاس: ${item.size} × ${item.qty} — ${formatPrice(unit)}</div>
            <div class="cart-item-price">${formatPrice(line)}</div>
            <div style="display:flex;gap:0.5rem;margin-top:0.35rem;align-items:center">
              <button type="button" class="btn btn-ghost btn-sm cart-qty-minus">−</button>
              <span>${item.qty}</span>
              <button type="button" class="btn btn-ghost btn-sm cart-qty-plus">+</button>
              <button type="button" class="cart-item-remove">حذف</button>
            </div>
          </div>
        </div>
      `;
    })
    .join('');

  if (totalEl) totalEl.textContent = formatPrice(getCartTotal());

  container.querySelectorAll('.cart-qty-minus').forEach((btn) => {
    btn.addEventListener('click', () => {
      const row = btn.closest('.cart-item');
      const id = row.dataset.id;
      const size = row.dataset.size;
      const item = loadCart().find((i) => i.productId === id && i.size === size);
      if (item) updateCartQty(id, size, item.qty - 1);
      renderCartDrawer();
      updateCartBadge();
    });
  });

  container.querySelectorAll('.cart-qty-plus').forEach((btn) => {
    btn.addEventListener('click', () => {
      const row = btn.closest('.cart-item');
      const id = row.dataset.id;
      const size = row.dataset.size;
      const item = loadCart().find((i) => i.productId === id && i.size === size);
      if (item) {
        const res = addToCart(id, size, 1);
        if (!res.ok) showToast(res.message, 'error');
      }
      renderCartDrawer();
      updateCartBadge();
    });
  });

  container.querySelectorAll('.cart-item-remove').forEach((btn) => {
    btn.addEventListener('click', () => {
      const row = btn.closest('.cart-item');
      removeFromCart(row.dataset.id, row.dataset.size);
      renderCartDrawer();
      updateCartBadge();
    });
  });
}

function openCart() {
  document.getElementById('cartDrawer')?.classList.add('open');
  document.getElementById('cartOverlay')?.classList.add('open');
  renderCartDrawer();
}

function closeCart() {
  document.getElementById('cartDrawer')?.classList.remove('open');
  document.getElementById('cartOverlay')?.classList.remove('open');
}

function initHome() {
  renderCategoryGrids();
  updateCartBadge();

  document.getElementById('cartBtn')?.addEventListener('click', openCart);
  document.getElementById('closeCart')?.addEventListener('click', closeCart);
  document.getElementById('cartOverlay')?.addEventListener('click', closeCart);

  const mainNav = document.getElementById('mainNav');
  const menuToggle = document.getElementById('menuToggle');

  menuToggle?.addEventListener('click', () => {
    mainNav?.classList.toggle('open');
  });

  document.addEventListener('click', (event) => {
    if (!mainNav || !mainNav.classList.contains('open')) return;
    if (menuToggle?.contains(event.target) || mainNav.contains(event.target)) return;
    mainNav.classList.remove('open');
  });

  mainNav?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => mainNav.classList.remove('open'));
  });

  document.getElementById('checkoutBtn')?.addEventListener('click', () => {
    if (!loadCart().length) {
      showToast('السلة فارغة', 'error');
      return;
    }
    closeCart();
    location.href = 'checkout.html';
  });

  updateAccountLink?.();

  window.addEventListener('cart-updated', () => {
    updateCartBadge();
    renderCartDrawer();
  });
}

if (document.querySelector('[data-category]')) {
  (async () => {
    await window.initRemoteProducts?.();
    initHome();
  })();
}
