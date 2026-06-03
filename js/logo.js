/** Smart Chef — شعار من الصورة (مقصّص ومضغوط) */
const LOGO_SRC = 'assets/logo.png';

function renderLogo(size = 'md') {
  return `
    <span class="brand-logo-img brand-logo-img--${size}" aria-label="Smart Chef Uniform">
      <span class="logo-crop">
        <img src="${LOGO_SRC}" alt="Smart Chef Uniform" decoding="async" />
      </span>
    </span>
  `;
}

function mountLogos() {
  document.querySelectorAll('[data-logo]').forEach((el) => {
    const size = el.dataset.logo || 'md';
    const href = el.dataset.logoHref;
    const inner = renderLogo(size);
    const extraStyle = el.getAttribute('style') || '';
    if (href && href !== 'none') {
      const wrap = document.createElement('a');
      wrap.href = href === 'index.html' ? 'index.html' : href;
      wrap.className = (el.className.replace('logo-mount', '').trim() + ' logo-link').trim();
      if (extraStyle) wrap.setAttribute('style', extraStyle);
      wrap.innerHTML = inner;
      el.replaceWith(wrap);
    } else {
      el.innerHTML = inner;
      if (extraStyle) el.setAttribute('style', extraStyle);
    }
  });
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', mountLogos);
}
