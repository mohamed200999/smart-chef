function showToast(message, type = 'success') {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = message;
  el.className = 'toast show ' + type;
  setTimeout(() => el.classList.remove('show'), 2800);
}

function fillGovernorateSelect() {
  const sel = document.getElementById('custGovernorate');
  if (!sel) return;
  GOVERNORATES.forEach((g) => {
    const opt = document.createElement('option');
    opt.value = g.id;
    opt.textContent = g.name;
    sel.appendChild(opt);
  });
}

function getSelectedGovernorate() {
  return document.getElementById('custGovernorate')?.value || '';
}

function renderSummary() {
  const cart = loadCart();
  const itemsEl = document.getElementById('summaryItems');
  const totalEl = document.getElementById('summaryTotal');
  const subtotalEl = document.getElementById('summarySubtotal');
  const shippingEl = document.getElementById('summaryShipping');

  if (!cart.length) {
    location.href = 'index.html';
    return;
  }

  itemsEl.innerHTML = cart
    .map((item) => {
      const p = getProductByIdWithStock(item.productId);
      if (!p) return '';
      const unit = getProductUnitPrice(p, item.size);
      return `
        <div class="summary-line">
          <span>${p.nameAr} <small>(${item.size}) × ${item.qty}</small></span>
          <span>${formatPrice(unit * item.qty)}</span>
        </div>
      `;
    })
    .join('');

  const subtotal = getCartTotal();
  const gov = getSelectedGovernorate();
  const totals = calcOrderTotals(subtotal, gov);

  if (subtotalEl) subtotalEl.textContent = formatPrice(totals.subtotal);
  if (shippingEl) {
    shippingEl.textContent =
      totals.shipping === 0
        ? 'مجاناً'
        : formatPrice(totals.shipping);
    shippingEl.style.color = totals.shipping ? 'var(--orange)' : '';
  }
  if (totalEl) totalEl.textContent = formatPrice(totals.total);

  const hint = document.getElementById('depositHint');
  if (hint) {
    hint.innerHTML = `عربون الآن (${PAYMENT.depositPercent}%): <strong style="color:var(--orange)">${formatPrice(totals.deposit)}</strong> — عند الاستلام: <strong>${formatPrice(totals.remainder)}</strong>`;
  }

  const note = document.getElementById('shippingNote');
  if (note && gov) {
    note.textContent =
      totals.shipping === 0
        ? '✓ شحن مجاني داخل القاهرة'
        : `+ ${formatPrice(totals.shipping)} شحن لمحافظة ${getGovernorateName(gov)}`;
  }
}

function prefillFromUser() {
  const user = getCurrentUser();
  const hint = document.getElementById('loginHint');
  if (user) {
    if (hint) hint.style.display = 'none';
    document.getElementById('custName').value = user.name || '';
    document.getElementById('custEmail').value = user.email || '';
    document.getElementById('custPhone').value = user.phone || '';
    document.getElementById('custAltPhone').value = user.altPhone || '';
    document.getElementById('custAddress').value = user.address || '';
  } else if (hint) {
    hint.style.display = 'block';
    hint.innerHTML =
      'لديك حساب؟ <a href="account.html?redirect=' +
      encodeURIComponent('checkout.html') +
      '" style="color:var(--orange);font-weight:600">سجّل دخولك</a> لملء بياناتك — أو <a href="account.html?tab=register&redirect=checkout.html" style="color:var(--orange)">أنشئ حساباً</a>';
  }
}

fillGovernorateSelect();
renderSummary();
prefillFromUser();
updateAccountLink?.();

document.getElementById('custGovernorate')?.addEventListener('change', renderSummary);

document.getElementById('checkoutForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const alert = document.getElementById('checkoutAlert');
  const governorate = getSelectedGovernorate();
  if (!governorate) {
    alert.innerHTML = '<div class="alert alert-error">اختر المحافظة</div>';
    return;
  }

  const customer = {
    name: document.getElementById('custName').value.trim(),
    email: document.getElementById('custEmail').value.trim(),
    phone: document.getElementById('custPhone').value.trim(),
    altPhone: document.getElementById('custAltPhone').value.trim(),
    governorate,
    address: document.getElementById('custAddress').value.trim(),
    notes: document.getElementById('custNotes').value.trim()
  };

  const result = placeOrder(customer);
  if (!result.ok) {
    alert.innerHTML = `<div class="alert alert-error">${result.message}</div>`;
    return;
  }
  location.href = 'payment.html?order=' + encodeURIComponent(result.order.id);
});
