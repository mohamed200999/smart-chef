function showToast(message, type = 'success') {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = message;
  el.className = 'toast show ' + type;
  setTimeout(() => el.classList.remove('show'), 3200);
}

const params = new URLSearchParams(location.search);
const orderId = params.get('order');
const main = document.getElementById('paymentMain');
let receiptFile = null;
let currentOrder = null;

if (!orderId) {
  main.innerHTML =
    '<p style="text-align:center"><a href="index.html" class="btn btn-primary">العودة للمتجر</a></p>';
} else {
  let order = getOrderById(orderId);
  if (order && order.depositRequired == null) {
    const split = calcPaymentSplit(order.total);
    order = updateOrder(orderId, {
      depositRequired: split.deposit,
      remainder: split.remainder,
      depositPercent: split.percent
    });
  }
  if (!order) {
    main.innerHTML =
      '<p style="text-align:center;color:var(--text-muted)">الطلب غير موجود.<br><a href="index.html" class="btn btn-primary" style="margin-top:1rem">الرئيسية</a></p>';
  } else {
    currentOrder = order;
    renderPaymentPage(order);
  }
}

function renderPaymentPage(order) {
  const subtotal = order.subtotal ?? order.total - (order.shippingFee || 0);
  const shipping = order.shippingFee ?? 0;
  const waMessage = buildOrderWhatsAppMessage(order);

  main.innerHTML = `
    <div class="checkout-steps">
      <span class="step done">① السلة</span>
      <span class="step done">② البيانات</span>
      <span class="step active">③ الدفع</span>
    </div>

    <h1>إتمام الدفع</h1>
    <p class="text-muted">رقم الطلب: <strong>${order.id}</strong></p>

    <div class="payment-cards">
      <div class="payment-card">
        <span>المنتجات</span>
        <strong>${formatPrice(subtotal)}</strong>
      </div>
      <div class="payment-card">
        <span>الشحن (${order.customer.governorateName || '—'})</span>
        <strong>${shipping ? formatPrice(shipping) : 'مجاناً'}</strong>
      </div>
      <div class="payment-card payment-card--total">
        <span>إجمالي الطلب</span>
        <strong>${formatPrice(order.total)}</strong>
      </div>
      <div class="payment-card payment-card--deposit">
        <span>تحوّل الآن (عربون ${order.depositPercent}%)</span>
        <strong>${formatPrice(order.depositRequired)}</strong>
      </div>
      <div class="payment-card payment-card--rest">
        <span>تدفعه عند الاستلام</span>
        <strong>${formatPrice(order.remainder)}</strong>
      </div>
    </div>

    <div class="admin-card wallet-card">
      <h3>رقم المحفظة للتحويل</h3>
      <p class="wallet-number" id="walletNum">${PAYMENT.walletDisplay}</p>
      <p class="text-muted">${PAYMENT.walletLabel}</p>
      <button type="button" class="btn btn-outline btn-sm" id="copyWallet">نسخ الرقم</button>
      <a href="${getWhatsAppUrl('استفسار عن طلب ' + order.id)}" class="btn btn-whatsapp btn-sm" style="margin-top:0.75rem" target="_blank" rel="noopener">تواصل واتساب ${CONTACT.whatsappDisplay}</a>
    </div>

    <div class="admin-card">
      <h3>خطوات الدفع</h3>
      <ol class="payment-steps-list">
        <li>حوّل مبلغ <strong>${formatPrice(order.depositRequired)}</strong> على <strong>${PAYMENT.walletDisplay}</strong></li>
        <li>ارفع صورة إيصال التحويل</li>
        <li>اضغط الزر بالأسفل — يفتح واتساب مع تفاصيل طلبك وصورة التحويل</li>
      </ol>
    </div>

    <div class="admin-card">
      <h3>صورة التحويل</h3>
      <div class="form-group">
        <input type="file" id="receiptFile" accept="image/*" capture="environment" />
      </div>
      <div id="receiptPreview" class="receipt-preview"></div>
      <button type="button" class="btn btn-primary btn-block" id="sendWhatsApp" disabled>
        إرسال التأكيد على واتساب (صورة + تفاصيل الطلب)
      </button>
      <p class="text-muted" style="font-size:0.85rem;margin-top:0.75rem">
        على الموبايل: تفتح واتساب مع الصورة والرسالة جاهزة. على الكمبيوتر: تفتح المحادثة — أرفق الصورة إن لم تُرفق تلقائياً.
      </p>
    </div>

    <div class="payment-items admin-card">
      <h3>ملخص الطلب</h3>
      ${order.items
        .map(
          (i) => `
        <div class="summary-line">
          <span>${i.nameAr} (${i.size}) × ${i.qty}</span>
          <span>${formatPrice(i.lineTotal)}</span>
        </div>
      `
        )
        .join('')}
      <div class="summary-line" style="margin-top:0.5rem">
        <span>العنوان</span>
        <span style="text-align:left;font-size:0.85rem">${order.customer.governorateName || ''} — ${order.customer.address || ''}</span>
      </div>
    </div>

    <a href="index.html" class="btn btn-ghost btn-block" style="margin-top:1rem">العودة للتسوق</a>
  `;

  document.getElementById('copyWallet')?.addEventListener('click', () => {
    const num = PAYMENT.walletDisplay.replace(/\s/g, '');
    navigator.clipboard?.writeText(num).then(() => showToast('تم نسخ الرقم'));
  });

  document.getElementById('receiptFile')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    receiptFile = file || null;
    const preview = document.getElementById('receiptPreview');
    const btn = document.getElementById('sendWhatsApp');
    if (!file) {
      preview.innerHTML = '';
      btn.disabled = true;
      return;
    }
    if (!file.type.startsWith('image/')) {
      showToast('يرجى اختيار صورة', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      preview.innerHTML = `<img src="${reader.result}" alt="معاينة التحويل" />`;
      updateOrder(order.id, { receiptImage: reader.result, paymentStatus: 'receipt_ready' });
      btn.disabled = false;
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('sendWhatsApp')?.addEventListener('click', () => {
    sendOrderToWhatsApp(order, waMessage);
  });

  if (order.receiptImage) {
    document.getElementById('receiptPreview').innerHTML =
      `<img src="${order.receiptImage}" alt="إيصال" />`;
    document.getElementById('sendWhatsApp').disabled = false;
    if (!receiptFile) receiptFile = dataUrlToFile(order.receiptImage);
  }
}

function dataUrlToFile(dataUrl) {
  try {
    const [header, data] = dataUrl.split(',');
    const mime = (header.match(/:(.*?);/) || [])[1] || 'image/jpeg';
    const bin = atob(data);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new File([arr], 'smartchef-receipt.jpg', { type: mime });
  } catch {
    return null;
  }
}

async function sendOrderToWhatsApp(order, message) {
  if (!receiptFile && order.receiptImage) {
    receiptFile = dataUrlToFile(order.receiptImage);
  }
  if (!receiptFile) {
    showToast('ارفع صورة التحويل أولاً', 'error');
    return;
  }

  updateOrder(order.id, {
    paymentStatus: 'receipt_sent',
    status: 'بانتظار تأكيد التحويل'
  });

  const file =
    receiptFile instanceof File
      ? receiptFile
      : new File([receiptFile], 'smartchef-receipt.jpg', {
          type: receiptFile.type || 'image/jpeg'
        });

  const shareData = { text: message, title: 'Smart Chef — تأكيد تحويل' };

  if (navigator.canShare) {
    try {
      if (navigator.canShare({ ...shareData, files: [file] })) {
        await navigator.share({ ...shareData, files: [file] });
        showToast('اختر واتساب من القائمة وأرسل', 'success');
        return;
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
    }
  }

  openWhatsAppChat(message);
  showToast('تم فتح واتساب — أرفق صورة التحويل من المعرض إن لم تظهر تلقائياً', 'success');
}
