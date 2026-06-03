/* Product detail page */
(async function () {
  await window.initRemoteProducts?.();
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const main = document.getElementById('productMain');

  if (!id) {
    main.innerHTML =
      '<p style="text-align:center;padding:4rem"><a href="index.html" class="btn btn-primary">العودة للمتجر</a></p>';
    return;
  }

  const product = getProductByIdWithStock(id);
  if (!product) {
    main.innerHTML =
      '<p style="text-align:center;padding:4rem;color:var(--text-muted)">المنتج غير موجود.<br><br><a href="index.html" class="btn btn-primary">العودة للمتجر</a></p>';
    return;
  }

  const cat = CATEGORIES[product.category];
  const sizes = getAvailableSizes(product);
  let selectedSize = sizes[0] || null;
  let qty = 1;
  const favOn = isFavorite(product.id);
  function priceForSize(size) {
    return getProductUnitPrice(product, size);
  }

  const waProduct = getWhatsAppUrl(
    `استفسار عن: ${product.nameAr} — ${formatProductPriceLabel(product)}`
  );

  function render() {
    const unavailable = product.available === false;
    const totalStock = selectedSize ? product.stock[selectedSize] : 0;
    const currentPrice = selectedSize ? priceForSize(selectedSize) : product.price;

    main.innerHTML = `
      <nav class="breadcrumb">
        <a href="index.html">الرئيسية</a> /
        <a href="index.html#${product.category}">${cat?.nameAr || ''}</a> /
        ${product.nameAr}
      </nav>
      <div class="product-detail">
        <div class="product-gallery">
          <img src="${product.image}" alt="${product.nameAr}" />
        </div>
        <div class="product-detail-info">
          <div class="product-title-row">
            <h1>${product.nameAr}</h1>
            <button type="button" class="fav-btn fav-btn--detail ${favOn ? 'active' : ''}" data-id="${product.id}" aria-label="المفضلة" aria-pressed="${favOn}">♥</button>
          </div>
          <p class="price" id="productPrice">${formatPrice(currentPrice)}</p>
          ${product.category === 'jackets' ? '<p class="text-muted" style="font-size:0.85rem;margin-bottom:0.75rem">مقاسات XL و XXL: +100 ج.م على السعر</p>' : ''}
          <p class="product-desc">${product.descriptionAr || ''}</p>

          <button type="button" class="size-guide-link" id="openSizeGuide">
            📏 دليل المقاسات
          </button>

          <label class="size-label">اختر المقاس</label>
          <div class="sizes-row" id="sizesRow">
            ${Object.entries(product.stock || {})
              .map(([size, n]) => {
                const avail = Number(n) > 0 && !unavailable;
                const sel = size === selectedSize;
                const sur =
                  product.category === 'jackets' && JACKET_LARGE_SIZES.includes(size)
                    ? ` · ${formatPrice(priceForSize(size))}`
                    : '';
                return `<button type="button" class="size-btn ${sel ? 'selected' : ''}" data-size="${size}" ${avail ? '' : 'disabled'}>${size}${sur}${avail ? '' : ' ✕'}</button>`;
              })
              .join('')}
          </div>

          <label class="qty-label">الكمية</label>
          <div class="qty-control">
            <button type="button" id="qtyMinus">−</button>
            <input type="number" id="qtyInput" value="${qty}" min="1" max="${totalStock}" readonly />
            <button type="button" id="qtyPlus">+</button>
          </div>
          <p class="stock-hint" id="stockHint">${unavailable ? 'غير متوفر حالياً — سيتوفر قريباً' : selectedSize ? `متوفر: ${totalStock} قطعة (مقاس ${selectedSize})` : 'اختر مقاساً'}</p>

          <div class="add-actions">
            <button type="button" class="btn btn-primary" id="addToCartBtn" ${unavailable || !selectedSize || totalStock < 1 ? 'disabled' : ''}>أضف للسلة</button>
            <a href="index.html" class="btn btn-outline">متابعة التسوق</a>
          </div>

          <div class="contact-bar" style="margin-top:2rem">
            <p class="contact-bar-title">استفسار عن هذا المنتج؟</p>
            <div class="contact-buttons">
              <a href="${waProduct}" class="btn-contact btn-whatsapp" target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                واتساب
              </a>
              <a href="${CONTACT.facebook}" class="btn-contact btn-facebook" target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                فيسبوك
              </a>
            </div>
          </div>
        </div>
      </div>
    `;

    document.title = product.nameAr + ' — Smart Chef';

    bindFavoriteButton(document.querySelector('.fav-btn--detail'));

    document.getElementById('openSizeGuide')?.addEventListener('click', () => {
      openSizeGuideModal(product.category);
    });

    document.querySelectorAll('.size-btn:not(:disabled)').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedSize = btn.dataset.size;
        const max = product.stock[selectedSize];
        if (qty > max) qty = max;
        render();
      });
    });

    document.getElementById('qtyMinus')?.addEventListener('click', () => {
      if (qty > 1) {
        qty--;
        render();
      }
    });

    document.getElementById('qtyPlus')?.addEventListener('click', () => {
      const max = product.stock[selectedSize] || 1;
      if (qty < max) {
        qty++;
        render();
      }
    });

    document.getElementById('addToCartBtn')?.addEventListener('click', () => {
      const res = addToCart(product.id, selectedSize, qty);
      if (res.ok) {
        showToast(res.message, 'success');
        updateCartBadge();
      } else showToast(res.message, 'error');
    });
  }

  render();
  updateCartBadge();
  updateFavoritesBadge();

  document.getElementById('cartBtn')?.addEventListener('click', () => {
    document.getElementById('cartDrawer')?.classList.add('open');
    document.getElementById('cartOverlay')?.classList.add('open');
    renderCartDrawer();
  });
  document.getElementById('closeCart')?.addEventListener('click', () => {
    document.getElementById('cartDrawer')?.classList.remove('open');
    document.getElementById('cartOverlay')?.classList.remove('open');
  });
  document.getElementById('cartOverlay')?.addEventListener('click', () => {
    document.getElementById('cartDrawer')?.classList.remove('open');
    document.getElementById('cartOverlay')?.classList.remove('open');
  });
})();
