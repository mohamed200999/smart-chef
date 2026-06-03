/* واجهة مشتركة: دليل مقاسات، تواصل، مفضلة */
function renderSizeGuideTable(guide) {
  if (!guide) return '';
  return `
    <p class="size-guide-note">${guide.note || ''}</p>
    <div class="size-guide-table-wrap">
      <table class="size-guide-table">
        <thead><tr>${guide.headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>
          ${guide.rows.map((row) => `<tr>${row.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function openSizeGuideModal(category) {
  const guide = getSizeGuide(category);
  let modal = document.getElementById('sizeGuideModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'sizeGuideModal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-backdrop" data-close-size-guide></div>
      <div class="modal-box modal-box--wide">
        <button type="button" class="modal-close" data-close-size-guide aria-label="إغلاق">✕</button>
        <h2 id="sizeGuideTitle"></h2>
        <div id="sizeGuideBody"></div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelectorAll('[data-close-size-guide]').forEach((el) => {
      el.addEventListener('click', () => modal.classList.remove('open'));
    });
  }
  document.getElementById('sizeGuideTitle').textContent = guide.title;
  document.getElementById('sizeGuideBody').innerHTML = renderSizeGuideTable(guide);
  modal.classList.add('open');
}

function renderContactBar(extraClass = '') {
  const wa = getWhatsAppUrl();
  return `
    <div class="contact-bar ${extraClass}">
      <p class="contact-bar-title">تواصل معنا</p>
      <div class="contact-buttons">
        <a href="${wa}" class="btn-contact btn-whatsapp" target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          واتساب
        </a>
        <a href="${CONTACT.facebook}" class="btn-contact btn-facebook" target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          فيسبوك
        </a>
      </div>
    </div>
  `;
}

function mountContactBars() {
  document.querySelectorAll('[data-contact-bar]').forEach((el) => {
    el.innerHTML = renderContactBar(el.dataset.contactBar || '');
  });
}

function updateFavoritesBadge() {
  const badge = document.getElementById('favBadge');
  if (!badge) return;
  const n = getFavoritesCount();
  badge.textContent = n;
  badge.classList.toggle('hidden', n === 0);
}

function renderFavoritesDrawer() {
  const container = document.getElementById('favItems');
  if (!container) return;
  const ids = loadFavorites();
  if (!ids.length) {
    container.innerHTML = '<div class="cart-empty"><p>لا توجد منتجات في المفضلة</p></div>';
    return;
  }
  container.innerHTML = ids
    .map((id) => {
      const p = getProductByIdWithStock(id);
      if (!p) return '';
      return `
        <div class="cart-item fav-item" data-id="${p.id}">
          <a href="product.html?id=${encodeURIComponent(p.id)}"><img src="${p.image}" alt="" /></a>
          <div class="cart-item-info">
            <a href="product.html?id=${encodeURIComponent(p.id)}" class="cart-item-name">${p.nameAr}</a>
            <div class="cart-item-price">${formatPrice(p.price)}</div>
            <button type="button" class="cart-item-remove fav-remove" data-id="${p.id}">إزالة من المفضلة</button>
          </div>
        </div>
      `;
    })
    .join('');

  container.querySelectorAll('.fav-remove').forEach((btn) => {
    btn.addEventListener('click', () => {
      toggleFavorite(btn.dataset.id);
      renderFavoritesDrawer();
      updateFavoritesBadge();
      document.querySelectorAll(`.fav-btn[data-id="${btn.dataset.id}"]`).forEach((b) => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      if (typeof renderCategoryGrids === 'function') renderCategoryGrids();
    });
  });
}

function openFavorites() {
  document.getElementById('favDrawer')?.classList.add('open');
  document.getElementById('favOverlay')?.classList.add('open');
  renderFavoritesDrawer();
}

function closeFavorites() {
  document.getElementById('favDrawer')?.classList.remove('open');
  document.getElementById('favOverlay')?.classList.remove('open');
}

function bindFavoriteButton(btn) {
  if (!btn || btn.dataset.bound) return;
  btn.dataset.bound = '1';
  const id = btn.dataset.id;
  if (isFavorite(id)) {
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');
  }
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const res = toggleFavorite(id);
    btn.classList.toggle('active', res.added);
    btn.setAttribute('aria-pressed', res.added ? 'true' : 'false');
    showToast(res.message, 'success');
    updateFavoritesBadge();
    if (document.getElementById('favDrawer')?.classList.contains('open')) renderFavoritesDrawer();
  });
}

function initFavoritesUI() {
  updateFavoritesBadge();
  document.getElementById('favBtn')?.addEventListener('click', openFavorites);
  document.getElementById('closeFav')?.addEventListener('click', closeFavorites);
  document.getElementById('favOverlay')?.addEventListener('click', closeFavorites);
  window.addEventListener('favorites-updated', updateFavoritesBadge);
}

function updateAccountLink() {
  const el = document.getElementById('accountLink');
  if (!el) return;
  const user = getCurrentUser();
  if (user) {
    el.href = 'account.html';
    el.textContent = '👤 ' + (user.name.split(' ')[0] || 'حسابي');
    el.title = user.name;
  } else {
    el.href = 'account.html';
    el.textContent = 'دخول / تسجيل';
    el.title = 'حساب العميل';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  mountContactBars();
  initFavoritesUI();
  updateAccountLink();
});

window.addEventListener('user-updated', updateAccountLink);
