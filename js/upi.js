// ============================================================
// upi.js — UPI deep-link, QR code display
// Depends on app.js (globalSettings)
// QR rendering requires qrcode.min.js loaded before this file.
// ============================================================

function payAdvance(amount = '') {
  if (!globalSettings.upi_id) {
    alert('UPI payment is not configured yet. Please contact the store.');
    return;
  }

  const upiId = globalSettings.upi_id;
  const name = encodeURIComponent(globalSettings.company_name || 'Merchant');
  let link = `upi://pay?pa=${upiId}&pn=${name}&cu=INR`;
  if (amount) link += `&am=${amount}`;

  window.open(link, '_blank');

  setTimeout(() => {
    alert(
      `If your UPI app didn't open automatically:\n\n` +
        `• Scan the QR code on this page, or\n` +
        `• Pay to UPI ID: ${upiId}`,
    );
  }, 2000);
}

function showUpiQR(containerId) {
  const container = document.getElementById(containerId);
  if (!container || !globalSettings.upi_id) return;

  const upiId = globalSettings.upi_id;
  const name = globalSettings.company_name || 'Merchant';
  const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&cu=INR`;
  const qrElId = containerId + '_qr';

  container.innerHTML = `
        <p style="font-size:0.8rem; color:var(--text-muted);
                  text-transform:uppercase; letter-spacing:0.05em;
                  margin-bottom:0.75rem;">Pay via UPI</p>
        <div id="${qrElId}" style="display:inline-block; margin-bottom:0.75rem;"></div>
        <p style="font-weight:700; font-size:1rem; margin:0; color:var(--text-main);
                  font-family:monospace;">${upiId}</p>
        <p style="font-size:0.8rem; color:var(--text-muted); margin-top:0.25rem;">
            Scan with PhonePe, GPay, Paytm or any UPI app.
        </p>
    `;

  if (typeof QRCode !== 'undefined') {
    new QRCode(document.getElementById(qrElId), {
      text: upiLink,
      width: 160,
      height: 160,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M,
    });
  } else {
    document.getElementById(qrElId).innerHTML =
      `<p style="color:var(--text-muted); font-size:0.875rem; padding:1rem;">
                QR unavailable — please use the UPI ID above.
             </p>`;
  }
}

function initUpiDisplay() {
  if (!globalSettings.upi_id) return;

  document.querySelectorAll('.upi-display').forEach((el) => {
    el.style.display = 'block';
    if (el.id) showUpiQR(el.id);
  });
}
