function showToast(message, type = 'success') {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = message;
  el.className = 'toast show ' + type;
  setTimeout(() => el.classList.remove('show'), 2800);
}

function showGuest() {
  document.getElementById('guestView').style.display = 'block';
  document.getElementById('userView').style.display = 'none';
}

function showUser(user) {
  document.getElementById('guestView').style.display = 'none';
  document.getElementById('userView').style.display = 'block';
  document.getElementById('userName').textContent = user.name;
  document.getElementById('userEmail').textContent = user.email;
  document.getElementById('profName').value = user.name;
  document.getElementById('profEmail').value = user.email;
  document.getElementById('profPhone').value = user.phone;
  document.getElementById('profAltPhone').value = user.altPhone || '';
  document.getElementById('profAddress').value = user.address || '';
  renderUserOrders(user.id);
}

function renderUserOrders(userId) {
  const el = document.getElementById('userOrders');
  const orders = getOrdersForUser(userId);
  if (!orders.length) {
    el.innerHTML = '<p class="text-muted">لا توجد طلبات بعد.</p>';
    return;
  }
  el.innerHTML = orders
    .map(
      (o) => `
    <div class="order-mini">
      <strong>${o.id}</strong>
      <span>${formatPrice(o.total)} — ${o.status}</span>
      <a href="payment.html?order=${encodeURIComponent(o.id)}" class="btn btn-outline btn-sm">تفاصيل / دفع</a>
    </div>
  `
    )
    .join('');
}

document.querySelectorAll('.auth-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.auth-tab').forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    const isLogin = tab.dataset.tab === 'login';
    document.getElementById('loginPanel').style.display = isLogin ? 'block' : 'none';
    document.getElementById('registerPanel').style.display = isLogin ? 'none' : 'block';
  });
});

const params = new URLSearchParams(location.search);
if (params.get('tab') === 'register') {
  document.querySelector('.auth-tab[data-tab="register"]')?.click();
}

const user = getCurrentUser();
if (user) showUser(user);
else showGuest();

document.getElementById('loginForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const alert = document.getElementById('loginAlert');
  const res = loginUser(
    document.getElementById('loginKey').value,
    document.getElementById('loginPass').value
  );
  if (!res.ok) {
    alert.innerHTML = `<div class="alert alert-error">${res.message}</div>`;
    return;
  }
  alert.innerHTML = '';
  const redirect = params.get('redirect');
  if (redirect) location.href = redirect;
  else showUser(res.user);
});

document.getElementById('registerForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const alert = document.getElementById('registerAlert');
  const p1 = document.getElementById('regPass').value;
  const p2 = document.getElementById('regPass2').value;
  if (p1 !== p2) {
    alert.innerHTML = '<div class="alert alert-error">كلمتا المرور غير متطابقتين</div>';
    return;
  }
  const res = registerUser({
    name: document.getElementById('regName').value,
    email: document.getElementById('regEmail').value,
    phone: document.getElementById('regPhone').value,
    password: p1
  });
  if (!res.ok) {
    alert.innerHTML = `<div class="alert alert-error">${res.message}</div>`;
    return;
  }
  alert.innerHTML = '<div class="alert alert-success">تم إنشاء الحساب!</div>';
  const redirect = params.get('redirect');
  if (redirect) location.href = redirect;
  else showUser(res.user);
});

document.getElementById('logoutBtn')?.addEventListener('click', () => {
  logoutUser();
  showGuest();
  showToast('تم تسجيل الخروج');
});

document.getElementById('profileForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const res = updateUserProfile({
    name: document.getElementById('profName').value.trim(),
    email: document.getElementById('profEmail').value.trim().toLowerCase(),
    phone: document.getElementById('profPhone').value.trim(),
    altPhone: document.getElementById('profAltPhone').value.trim(),
    address: document.getElementById('profAddress').value.trim()
  });
  if (res.ok) showToast('تم حفظ البيانات');
  else showToast(res.message, 'error');
});
