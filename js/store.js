/* Smart Chef Uniform — Store logic */
const STORAGE = {
  products: 'smartchef_products',
  productOverrides: 'smartchef_product_overrides',
  cart: 'smartchef_cart',
  orders: 'smartchef_orders',
  admin: 'smartchef_admin_session',
  favorites: 'smartchef_favorites',
  users: 'smartchef_users',
  userSession: 'smartchef_user_session'
};

const ADMIN_PASSWORDS = {
  master: '2009',
  manager: '5000'
};

const REMOTE_PRODUCTS_TABLE = 'products';

function isRemoteSyncEnabled() {
  return Boolean(window.API_ENABLED || window.SUPABASE_ENABLED);
}

/** غيّر الروابط وأرقام الدفع */
const CONTACT = {
  whatsapp: '201212738655',
  whatsappDisplay: '01212738655',
  whatsappMessage: 'مرحباً، أريد الاستفسار عن يونيفورم Smart Chef',
  facebook: 'https://www.facebook.com/'
};

/** محفظة الدفع — نسبة العربون من إجمالي الطلب */
const PAYMENT = {
  walletPhone: '201212738655',
  walletDisplay: '01212738655',
  walletLabel: 'فودافون كاش / إنستاباي',
  depositPercent: 50
};

/** الشحن: القاهرة مجاناً — باقي المحافظات */
const SHIPPING = {
  feeOutsideCairo: 100,
  freeGovernorateIds: ['cairo', 'القاهرة']
};

const GOVERNORATES = [
  { id: 'cairo', name: 'القاهرة' },
  { id: 'giza', name: 'الجيزة' },
  { id: 'alexandria', name: 'الإسكندرية' },
  { id: 'dakahlia', name: 'الدقهلية' },
  { id: 'sharqia', name: 'الشرقية' },
  { id: 'qalyubia', name: 'القليوبية' },
  { id: 'gharbia', name: 'الغربية' },
  { id: 'monufia', name: 'المنوفية' },
  { id: 'beheira', name: 'البحيرة' },
  { id: 'ismailia', name: 'الإسماعيلية' },
  { id: 'port-said', name: 'بورسعيد' },
  { id: 'suez', name: 'السويس' },
  { id: 'kafr-el-sheikh', name: 'كفر الشيخ' },
  { id: 'fayoum', name: 'الفيوم' },
  { id: 'beni-suef', name: 'بني سويف' },
  { id: 'minya', name: 'المنيا' },
  { id: 'asyut', name: 'أسيوط' },
  { id: 'sohag', name: 'سوهاج' },
  { id: 'qena', name: 'قنا' },
  { id: 'luxor', name: 'الأقصر' },
  { id: 'aswan', name: 'أسوان' },
  { id: 'red-sea', name: 'البحر الأحمر' },
  { id: 'new-valley', name: 'الوادي الجديد' },
  { id: 'matrouh', name: 'مرسى مطروح' },
  { id: 'north-sinai', name: 'شمال سيناء' },
  { id: 'south-sinai', name: 'جنوب سيناء' },
  { id: 'damietta', name: 'دمياط' }
];

function isCairoGovernorate(governorateId) {
  if (!governorateId) return false;
  const id = String(governorateId).toLowerCase();
  return id === 'cairo' || id === 'القاهرة';
}

function calcShippingFee(governorateId) {
  return isCairoGovernorate(governorateId) ? 0 : SHIPPING.feeOutsideCairo;
}

function getGovernorateName(governorateId) {
  const g = GOVERNORATES.find((x) => x.id === governorateId);
  return g ? g.name : governorateId || '';
}

function calcOrderTotals(subtotal, governorateId) {
  const shipping = calcShippingFee(governorateId);
  const total = Number(subtotal) + shipping;
  const split = calcPaymentSplit(total);
  return {
    subtotal: Number(subtotal),
    shipping,
    total,
    ...split
  };
}

const SIZE_GUIDES = {
  jackets: {
    title: 'دليل مقاسات الجواكيت',
    note: 'القياسات بالسنتيمتر. يُفضّل قياس الصدر عند الاسترخاء.',
    headers: ['المقاس', 'الصدر', 'الخصر', 'الطول', 'الكم'],
    rows: [
      ['S', '96–100', '88–92', '68', '58'],
      ['M', '100–104', '92–96', '70', '60'],
      ['L', '104–108', '96–100', '72', '62'],
      ['XL', '108–112', '100–104', '74', '64'],
      ['XXL', '112–118', '104–110', '76', '64']
    ]
  },
  pants: {
    title: 'دليل مقاسات البناطيل',
    note: 'قياس الخصر عند خط الحزام.',
    headers: ['المقاس', 'الخصر', 'الورك', 'الطول'],
    rows: [
      ['S', '76–80', '96–100', '100'],
      ['M', '80–86', '100–104', '102'],
      ['L', '86–92', '104–108', '104'],
      ['XL', '92–98', '108–112', '104'],
      ['XXL', '98–104', '112–118', '106']
    ]
  },
  aprons: {
    title: 'دليل مقاسات المرايل',
    note: 'مرايل بمقاس موحّد قابلة للتعديل بالحزام.',
    headers: ['النوع', 'العرض', 'الطول', 'ملاحظات'],
    rows: [['واحد / موحّد', '65 سم', '85 سم', 'حمالات قابلة للتعديل']]
  },
  caps: {
    title: 'دليل مقاسات الكابات',
    note: 'مقاسات دائرية للرأس.',
    headers: ['المقاس', 'محيط الرأس', 'ملاحظات'],
    rows: [['واحد', '56–60 سم', 'سناب باك قابل للتعديل']]
  },
  soap: {
    title: 'دليل الصابون',
    note: 'أضف الحجم أو النوع حسب المنتج.',
    headers: ['النوع', 'الوزن', 'ملاحظات'],
    rows: [['صابون عادي', '100-150 جم', 'متوفر بأنواع مختلفة']]
  },
  toques: {
    title: 'دليل مقاسات التوكات',
    note: 'ارتفاع التوكة مناسب لمعظم الرؤوس.',
    headers: ['المقاس', 'محيط الرأس', 'الارتفاع'],
    rows: [
      ['S', '54–56 سم', '22 سم'],
      ['M', '56–58 سم', '24 سم'],
      ['L', '58–60 سم', '26 سم']
    ]
  }
};

function getSizeGuide(category) {
  return SIZE_GUIDES[category] || SIZE_GUIDES.jackets;
}

function getWhatsAppUrl(text) {
  const msg = encodeURIComponent(text || CONTACT.whatsappMessage);
  const phone = String(CONTACT.whatsapp).replace(/\D/g, '');
  return `https://api.whatsapp.com/send?phone=${phone}&text=${msg}`;
}

function openWhatsAppChat(text) {
  const url = getWhatsAppUrl(text);
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => a.remove(), 200);
}

function buildOrderWhatsAppMessage(order) {
  const c = order.customer || {};
  const itemsLines = (order.items || [])
    .map(
      (i) =>
        `• ${i.nameAr} — مقاس ${i.size} — الكمية ${i.qty} — ${formatPrice(i.lineTotal)}`
    )
    .join('\n');

  const parts = [
    '🧾 *تأكيد تحويل عربون — Smart Chef Uniform*',
    '',
    `📌 *رقم الطلب:* ${order.id}`,
    '',
    '👤 *بيانات العميل*',
    `الاسم: ${c.name || '—'}`,
    `البريد: ${c.email || '—'}`,
    `الهاتف: ${c.phone || '—'}`,
    `هاتف بديل: ${c.altPhone || '—'}`,
    '',
    '📍 *عنوان الشحن*',
    `المحافظة: ${c.governorateName || c.governorate || '—'}`,
    `العنوان: ${c.address || '—'}`,
    c.notes ? `ملاحظات: ${c.notes}` : '',
    '',
    '🛒 *تفاصيل الطلب*',
    itemsLines || '—',
    '',
    `مجموع المنتجات: ${formatPrice(order.subtotal ?? order.total)}`,
    order.shippingFee ? `الشحن: ${formatPrice(order.shippingFee)}` : 'الشحن: مجاناً',
    `*الإجمالي:* ${formatPrice(order.total)}`,
    `*عربون محوّل الآن:* ${formatPrice(order.depositRequired)}`,
    `*المتبقي عند الاستلام:* ${formatPrice(order.remainder)}`,
    '',
    '📎 *مرفق:* صورة إيصال التحويل'
  ];

  return parts.filter((line) => line !== '').join('\n');
}

function calcPaymentSplit(total) {
  const deposit = Math.round(Number(total) * (PAYMENT.depositPercent / 100));
  const remainder = Math.max(0, Number(total) - deposit);
  return { deposit, remainder, percent: PAYMENT.depositPercent };
}

/* Accounts */
function hashPassword(password) {
  const s = password + '|smartchef|2026';
  try {
    return btoa(unescape(encodeURIComponent(s)));
  } catch {
    return s;
  }
}

function loadUsers() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE.users) || '[]');
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(STORAGE.users, JSON.stringify(users));
}

function getCurrentUser() {
  try {
    const raw = sessionStorage.getItem(STORAGE.userSession);
    if (!raw) return null;
    const session = JSON.parse(raw);
    return loadUsers().find((u) => u.id === session.userId) || null;
  } catch {
    return null;
  }
}

function setUserSession(user) {
  sessionStorage.setItem(STORAGE.userSession, JSON.stringify({ userId: user.id }));
  window.dispatchEvent(new CustomEvent('user-updated'));
}

function logoutUser() {
  sessionStorage.removeItem(STORAGE.userSession);
  window.dispatchEvent(new CustomEvent('user-updated'));
}

function registerUser({ name, email, phone, password, address, altPhone }) {
  const users = loadUsers();
  const emailNorm = email.trim().toLowerCase();
  if (users.some((u) => u.email === emailNorm)) {
    return { ok: false, message: 'البريد مسجّل مسبقاً — سجّل دخولك' };
  }
  if (password.length < 6) {
    return { ok: false, message: 'كلمة المرور 6 أحرف على الأقل' };
  }
  const user = {
    id: 'USR-' + Date.now(),
    name: name.trim(),
    email: emailNorm,
    phone: phone.trim(),
    altPhone: (altPhone || '').trim(),
    address: (address || '').trim(),
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString()
  };
  users.push(user);
  saveUsers(users);
  setUserSession(user);
  return { ok: true, user };
}

function loginUser(emailOrPhone, password) {
  const key = emailOrPhone.trim().toLowerCase();
  const user = loadUsers().find(
    (u) => u.email === key || u.phone === emailOrPhone.trim()
  );
  if (!user || user.passwordHash !== hashPassword(password)) {
    return { ok: false, message: 'بيانات الدخول غير صحيحة' };
  }
  setUserSession(user);
  return { ok: true, user };
}

function updateUserProfile(updates) {
  const current = getCurrentUser();
  if (!current) return { ok: false, message: 'غير مسجّل' };
  const users = loadUsers();
  const idx = users.findIndex((u) => u.id === current.id);
  if (idx < 0) return { ok: false, message: 'خطأ' };
  users[idx] = { ...users[idx], ...updates, id: current.id, passwordHash: users[idx].passwordHash };
  saveUsers(users);
  setUserSession(users[idx]);
  return { ok: true, user: users[idx] };
}

function loadOrders() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE.orders) || '[]');
  } catch {
    return [];
  }
}

function saveOrders(orders) {
  localStorage.setItem(STORAGE.orders, JSON.stringify(orders));
}

function getOrderById(id) {
  return loadOrders().find((o) => o.id === id) || null;
}

function updateOrder(id, patch) {
  const orders = loadOrders();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx < 0) return null;
  orders[idx] = { ...orders[idx], ...patch };
  saveOrders(orders);
  return orders[idx];
}

function getOrdersForUser(userId) {
  return loadOrders().filter((o) => o.userId === userId);
}

/** جواكيت: XL و XXL +100 ج.م */
const JACKET_LARGE_SIZES = ['XL', 'XXL'];
const JACKET_SIZE_SURCHARGE = 100;

function getProductUnitPrice(product, size) {
  if (!product) return 0;
  let price = Number(product.price) || 0;
  if (
    product.category === 'jackets' &&
    size &&
    JACKET_LARGE_SIZES.includes(String(size).toUpperCase())
  ) {
    price += JACKET_SIZE_SURCHARGE;
  }
  return price;
}

function formatProductPriceLabel(product) {
  if (product.category === 'jackets') {
    return `من ${formatPrice(product.price)} · XL/XXL ${formatPrice(product.price + JACKET_SIZE_SURCHARGE)}`;
  }
  return formatPrice(product.price);
}

const CATEGORIES = {
  jackets: { id: 'jackets', nameAr: 'جواكيت', nameEn: 'Jackets', icon: '🧥' },
  aprons: { id: 'aprons', nameAr: 'مرايل', nameEn: 'Aprons', icon: '👨‍🍳' },
  caps: { id: 'caps', nameAr: 'كابات', nameEn: 'Caps', icon: '🧢' },
  pants: { id: 'pants', nameAr: 'بناطيل', nameEn: 'Pants', icon: '👖' },
  soap: { id: 'soap', nameAr: 'صابوه', nameEn: 'Soap', icon: '👟' },
  toques: { id: 'toques', nameAr: 'توكات', nameEn: 'Toques', icon: '👒' }
};

const DEFAULT_PRODUCTS = [
  {
    id: 'jacket-burgundy',
    nameAr: 'جاكيت شيف — بورجوندي',
    nameEn: 'Chef Jacket — Burgundy',
    category: 'jackets',
    price: 500,
    image: 'assets/jacket-burgundy.png',
    descriptionAr: 'جاكيت شيف احترافي مزدوج الصدر، قماش متين مناسب للمطبخ، يوفر راحة وحركة أثناء العمل.',
    available: true,
    stock: { S: 4, M: 8, L: 6, XL: 4, XXL: 2 }
  },
  {
    id: 'jacket-navy',
    nameAr: 'جاكيت شيف — كحلي',
    nameEn: 'Chef Jacket — Navy',
    category: 'jackets',
    price: 500,
    image: 'assets/jacket-navy.png',
    descriptionAr: 'تصميم عصري بأزرار معدنية وياقة صينية، أكمام ثلاثة أرباع، مناسب للطهاة المحترفين.',
    available: true,
    stock: { S: 3, M: 7, L: 5, XL: 3, XXL: 2 }
  },
  {
    id: 'jacket-white',
    nameAr: 'جاكيت شيف — أبيض',
    nameEn: 'Chef Jacket — White',
    category: 'jackets',
    price: 500,
    image: 'assets/jacket-white.png',
    descriptionAr: 'جاكيت أبيض كلاسيكي بأكمام قصيرة وجيوب للأقلام، خامة قطنية مريحة وقابلة للغسيل.',
    available: true,
    stock: { S: 5, M: 10, L: 8, XL: 5, XXL: 3 }
  },
  {
    id: 'apron-denim',
    nameAr: 'مريلة دينيم احترافية',
    nameEn: 'Professional Denim Apron',
    category: 'aprons',
    price: 300,
    image: 'assets/apron-denim.png',
    descriptionAr: 'مريلة دينيم ثقيلة بحمالات جلد و جيوب متعددة، مثالية للمقاهي والمطاعم.',
    available: true,
    stock: { 'واحد': 12 }
  },
  {
    id: 'cap-chef-life',
    nameAr: 'كاب CHEF LIFE',
    nameEn: 'CHEF LIFE Snapback Cap',
    category: 'caps',
    price: 200,
    image: 'assets/cap-chef-life.png',
    descriptionAr: 'كاب سناب باك أسود بتطريز أبيض، تصميم عصري يناسب طاقم المطبخ.',
    available: true,
    stock: { 'واحد': 15 }
  }
];

const PLACEHOLDER_UNAVAILABLE = [
  { category: 'pants', nameAr: 'بنطلون شيف', price: null },
  { category: 'pants', nameAr: 'بنطلون مطبخ كلاسيكي', price: null },
  { category: 'soap', nameAr: 'صابوه طبيعية', price: null },
  { category: 'soap', nameAr: 'صابوه سائل', price: null },
  { category: 'toques', nameAr: 'توكة شيف كلاسيكية', price: null },
  { category: 'toques', nameAr: 'توكة عالية الجودة', price: null }
];

function loadCustomProducts() {
  try {
    const raw = localStorage.getItem(STORAGE.products);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCustomProducts(list) {
  localStorage.setItem(STORAGE.products, JSON.stringify(list));
}

function loadProductOverrides() {
  try {
    const raw = localStorage.getItem(STORAGE.productOverrides);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveProductOverrides(list) {
  localStorage.setItem(STORAGE.productOverrides, JSON.stringify(list));
}

function getAllProducts() {
  const custom = loadCustomProducts();
  const overrides = loadProductOverrides();
  const map = new Map(DEFAULT_PRODUCTS.map((p) => [p.id, { ...p }]));
  overrides.forEach((p) => map.set(p.id, { ...map.get(p.id) || {}, ...p }));
  custom.forEach((p) => map.set(p.id, p));
  return Array.from(map.values());
}

function getProductById(id) {
  return getProductByIdWithStock(id) || getAllProducts().find((p) => p.id === id) || null;
}

function getProductsByCategory(categoryId) {
  return getAllProducts().filter((p) => p.category === categoryId && p.available !== false);
}

function getTotalStock(product) {
  if (!product.stock) return 0;
  return Object.values(product.stock).reduce((a, b) => a + Number(b), 0);
}

function getAvailableSizes(product) {
  if (!product.stock) return [];
  return Object.entries(product.stock)
    .filter(([, qty]) => Number(qty) > 0)
    .map(([size]) => size);
}

function formatPrice(n) {
  return `${Number(n).toLocaleString('ar-EG')} ج.م`;
}

/* Favorites */
function loadFavorites() {
  try {
    const raw = localStorage.getItem(STORAGE.favorites);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveFavorites(ids) {
  localStorage.setItem(STORAGE.favorites, JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent('favorites-updated'));
}

function isFavorite(productId) {
  return loadFavorites().includes(productId);
}

function getFavoritesCount() {
  return loadFavorites().length;
}

function toggleFavorite(productId) {
  let ids = loadFavorites();
  const on = ids.includes(productId);
  if (on) ids = ids.filter((id) => id !== productId);
  else ids.push(productId);
  saveFavorites(ids);
  return { ok: true, added: !on, message: on ? 'تمت الإزالة من المفضلة' : 'تمت الإضافة للمفضلة' };
}

/* Cart */
function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE.cart);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(STORAGE.cart, JSON.stringify(cart));
  window.dispatchEvent(new CustomEvent('cart-updated'));
}

function getCartCount() {
  return loadCart().reduce((sum, item) => sum + item.qty, 0);
}

function getCartTotal() {
  return loadCart().reduce((sum, item) => {
    const p = getProductByIdWithStock(item.productId);
    return sum + (p ? getProductUnitPrice(p, item.size) * item.qty : 0);
  }, 0);
}

function getCartLineTotal(item) {
  const p = getProductByIdWithStock(item.productId);
  if (!p) return 0;
  return getProductUnitPrice(p, item.size) * item.qty;
}

function addToCart(productId, size, qty = 1) {
  const product = getProductByIdWithStock(productId);
  if (!product || !product.available) return { ok: false, message: 'المنتج غير متوفر' };

  const stock = product.stock?.[size] ?? 0;
  if (stock < 1) return { ok: false, message: 'المقاس غير متوفر' };

  const cart = loadCart();
  const idx = cart.findIndex((i) => i.productId === productId && i.size === size);
  const current = idx >= 0 ? cart[idx].qty : 0;
  if (current + qty > stock) {
    return { ok: false, message: `الكمية المتاحة: ${stock} فقط` };
  }

  if (idx >= 0) cart[idx].qty += qty;
  else cart.push({ productId, size, qty });

  saveCart(cart);
  return { ok: true, message: 'تمت الإضافة للسلة' };
}

function updateCartQty(productId, size, qty) {
  let cart = loadCart();
  const idx = cart.findIndex((i) => i.productId === productId && i.size === size);
  if (idx < 0) return;

  const product = getProductByIdWithStock(productId);
  const max = product?.stock?.[size] ?? 99;

  if (qty <= 0) cart = cart.filter((_, i) => i !== idx);
  else cart[idx].qty = Math.min(qty, max);

  saveCart(cart);
}

function removeFromCart(productId, size) {
  saveCart(loadCart().filter((i) => !(i.productId === productId && i.size === size)));
}

function clearCart() {
  saveCart([]);
}

/* Orders */
function placeOrder(customer) {
  const cart = loadCart();
  if (!cart.length) return { ok: false, message: 'السلة فارغة' };

  const stockAll = JSON.parse(localStorage.getItem('smartchef_stock') || '{}');
  DEFAULT_PRODUCTS.forEach((p) => {
    if (!stockAll[p.id]) stockAll[p.id] = { ...p.stock };
  });

  for (const item of cart) {
    const p = getProductByIdWithStock(item.productId);
    const avail = stockAll[item.productId]?.[item.size] ?? p?.stock?.[item.size] ?? 0;
    if (Number(avail) < item.qty) {
      return { ok: false, message: `الكمية غير متوفرة لـ ${p?.nameAr || 'منتج'} (مقاس ${item.size})` };
    }
  }

  cart.forEach((item) => {
    if (!stockAll[item.productId]) stockAll[item.productId] = {};
    const current = Number(stockAll[item.productId][item.size] || 0);
    stockAll[item.productId][item.size] = Math.max(0, current - item.qty);
  });
  localStorage.setItem('smartchef_stock', JSON.stringify(stockAll));

  const custom = loadCustomProducts().map((p) =>
    stockAll[p.id] ? { ...p, stock: stockAll[p.id] } : p
  );
  saveCustomProducts(custom);

  const items = cart.map((item) => {
    const p = getProductByIdWithStock(item.productId);
    const unit = getProductUnitPrice(p, item.size);
    return {
      ...item,
      nameAr: p?.nameAr,
      price: unit,
      lineTotal: unit * item.qty
    };
  });

  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  const totals = calcOrderTotals(subtotal, customer.governorate);
  const user = getCurrentUser();

  const order = {
    id: 'ORD-' + Date.now(),
    date: new Date().toISOString(),
    customer: {
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      altPhone: customer.altPhone || '',
      governorate: customer.governorate,
      governorateName: getGovernorateName(customer.governorate),
      address: customer.address,
      notes: customer.notes || ''
    },
    items,
    subtotal: totals.subtotal,
    shippingFee: totals.shipping,
    total: totals.total,
    depositRequired: totals.deposit,
    remainder: totals.remainder,
    depositPercent: totals.percent,
    paymentStatus: 'awaiting_transfer',
    receiptImage: null,
    userId: user?.id || null,
    status: 'بانتظار التحويل'
  };

  const orders = loadOrders();
  orders.unshift(order);
  saveOrders(orders);

  if (user) {
    updateUserProfile({
      name: customer.name,
      phone: customer.phone,
      altPhone: customer.altPhone || user.altPhone,
      address: customer.address,
      email: customer.email || user.email
    });
  }

  clearCart();
  return { ok: true, order };
}

function applySavedStock() {
  try {
    const saved = JSON.parse(localStorage.getItem('smartchef_stock') || '{}');
    getAllProducts().forEach((p) => {
      if (saved[p.id]) p.stock = saved[p.id];
    });
  } catch { /* ignore */ }
}

applySavedStock();

function mergeStockIntoProducts(products) {
  try {
    const saved = JSON.parse(localStorage.getItem('smartchef_stock') || '{}');
    return products.map((p) => (saved[p.id] ? { ...p, stock: saved[p.id] } : p));
  } catch {
    return products;
  }
}

function getAllProductsWithStock() {
  return mergeStockIntoProducts(getAllProducts());
}

function getProductByIdWithStock(id) {
  return getAllProductsWithStock().find((p) => p.id === id) || null;
}

/* Admin */
function isAdminLoggedIn() {
  return sessionStorage.getItem(STORAGE.admin) === '1';
}

function adminLogin(password) {
  if (password === ADMIN_PASSWORD) {
    sessionStorage.setItem(STORAGE.admin, '1');
    return true;
  }
  return false;
}

function adminLogout() {
  sessionStorage.removeItem(STORAGE.admin);
}

function adminAddProduct(data) {
  const custom = loadCustomProducts();
  const id = 'custom-' + Date.now();
  const product = {
    id,
    nameAr: data.nameAr,
    nameEn: data.nameEn || data.nameAr,
    category: data.category,
    price: Number(data.price),
    image: data.image,
    descriptionAr: data.descriptionAr || '',
    available: true,
    stock: data.stock,
    isCustom: true
  };
  custom.push(product);
  saveCustomProducts(custom);
  const stockAll = JSON.parse(localStorage.getItem('smartchef_stock') || '{}');
  stockAll[id] = data.stock;
  localStorage.setItem('smartchef_stock', JSON.stringify(stockAll));
  if (isRemoteSyncEnabled()) {
    upsertRemoteProduct(product);
  }
  return product;
}

function adminDeleteProduct(id) {
  if (DEFAULT_PRODUCTS.some((p) => p.id === id)) return false;
  saveCustomProducts(loadCustomProducts().filter((p) => p.id !== id));
  if (isRemoteSyncEnabled()) {
    deleteRemoteProduct(id);
  }
  return true;
}

function adminUpdateStock(id, stock) {
  const stockAll = JSON.parse(localStorage.getItem('smartchef_stock') || '{}');
  stockAll[id] = stock;
  localStorage.setItem('smartchef_stock', JSON.stringify(stockAll));

  const custom = loadCustomProducts();
  const idx = custom.findIndex((p) => p.id === id);
  if (idx >= 0) {
    custom[idx].stock = stock;
    saveCustomProducts(custom);
  }
}

function getAdminRole() {
  const role = sessionStorage.getItem(STORAGE.admin);
  if (role === 'manager' || role === 'master') return role;
  if (role === '1') return 'master';
  return null;
}

function isAdminLoggedIn() {
  return !!getAdminRole();
}

function adminLogin(password) {
  if (password === ADMIN_PASSWORDS.master) {
    sessionStorage.setItem(STORAGE.admin, 'master');
    return true;
  }
  if (password === ADMIN_PASSWORDS.manager) {
    sessionStorage.setItem(STORAGE.admin, 'manager');
    return true;
  }
  return false;
}

function adminLogout() {
  sessionStorage.removeItem(STORAGE.admin);
}

function adminUpdateProduct(id, updates) {
  const product = getProductById(id);
  if (!product) return false;

  const custom = loadCustomProducts();
  const overrideIds = new Set(DEFAULT_PRODUCTS.map((p) => p.id));
  const customIdx = custom.findIndex((p) => p.id === id);

  const updated = {
    ...product,
    ...updates,
    price: Number(updates.price ?? product.price),
    available: updates.available !== undefined ? updates.available : product.available,
    stock: updates.stock ?? product.stock
  };

  if (customIdx >= 0) {
    custom[customIdx] = updated;
    saveCustomProducts(custom);
  } else if (overrideIds.has(id)) {
    const overrides = loadProductOverrides();
    const overrideIdx = overrides.findIndex((p) => p.id === id);
    if (overrideIdx >= 0) {
      overrides[overrideIdx] = updated;
    } else {
      overrides.push(updated);
    }
    saveProductOverrides(overrides);
  } else {
    const overrides = loadProductOverrides();
    const overrideIdx = overrides.findIndex((p) => p.id === id);
    if (overrideIdx >= 0) {
      overrides[overrideIdx] = updated;
    } else {
      overrides.push(updated);
    }
    saveProductOverrides(overrides);
  }

  if (updates.stock) {
    adminUpdateStock(id, updates.stock);
  }

  if (isRemoteSyncEnabled()) {
    upsertRemoteProduct(updated);
  }

  return true;
}

function adminDeleteStoreProduct(id) {
  const custom = loadCustomProducts();
  const customIdx = custom.findIndex((p) => p.id === id);
  if (customIdx >= 0) {
    custom.splice(customIdx, 1);
    saveCustomProducts(custom);
    if (isRemoteSyncEnabled()) {
      deleteRemoteProduct(id);
    }
    return true;
  }

  const product = getProductById(id);
  if (!product) return false;
  const overrides = loadProductOverrides();
  const idx = overrides.findIndex((p) => p.id === id);
  const deleted = { ...product, available: false };
  if (idx >= 0) {
    overrides[idx] = { ...overrides[idx], ...deleted };
  } else {
    overrides.push(deleted);
  }
  saveProductOverrides(overrides);
  if (isRemoteSyncEnabled()) {
    upsertRemoteProduct(deleted);
  }
  return true;
}

if (typeof module !== 'undefined') module.exports = {};
