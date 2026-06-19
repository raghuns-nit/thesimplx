// ============================================================
// upi.js — UPI deep-link, QR code display
// Depends on app.js (globalSettings)
// QR rendering requires qrcode.min.js loaded before this file.
// ============================================================

/**
 * Open the UPI payment intent.
 * Uses window.open (new tab) so the product page stays open on desktop.
 * Shows a fallback alert after 2 s for browsers with no UPI app registered.
 *
 * @param {number|string} amount  Optional pre-filled amount in INR.
 */
function payAdvance(amount = "") {
  if (!globalSettings.upiId) {
    alert("UPI payment is not configured yet. Please contact the store.");
    return;
  }

  const upiId = globalSettings.upiId;
  const name = encodeURIComponent(globalSettings.companyName || "Merchant");
  let link = `upi://pay?pa=${upiId}&pn=${name}&cu=INR`;
  if (amount) link += `&am=${amount}`;

  // FIX: open in new context so product page is not navigated away
  window.open(link, "_blank");

  // Fallback for desktop where no UPI app is installed
  setTimeout(() => {
    alert(
      `If your UPI app didn't open automatically:\n\n` +
        `• Scan the QR code on this page, or\n` +
        `• Pay to UPI ID: ${upiId}`,
    );
  }, 2000);
}

/**
 * Render a UPI payment QR code inside a container element.
 * The QR encodes the upi://pay URI without a fixed amount
 * so the payer can enter it inside their app.
 *
 * @param {string} containerId  id of the DOM element to populate.
 */
function showUpiQR(containerId) {
  const container = document.getElementById(containerId);
  if (!container || !globalSettings.upiId) return;

  const upiId = globalSettings.upiId;
  const name = globalSettings.companyName || "Merchant";
  const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&cu=INR`;
  const qrElId = containerId + "_qr";

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

  if (typeof QRCode !== "undefined") {
    new QRCode(document.getElementById(qrElId), {
      text: upiLink,
      width: 160,
      height: 160,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.M,
    });
  } else {
    // Library not loaded — show text fallback
    document.getElementById(qrElId).innerHTML =
      `<p style="color:var(--text-muted); font-size:0.875rem; padding:1rem;">
                QR unavailable — please use the UPI ID above.
             </p>`;
  }
}

/**
 * Find every element with class "upi-display" on the page,
 * make it visible, and render a QR code inside it.
 * Called by app.js → window.onAppReady once globalSettings is loaded.
 */
function initUpiDisplay() {
  if (!globalSettings.upiId) return; // UPI not configured — nothing to show

  document.querySelectorAll(".upi-display").forEach((el) => {
    el.style.display = "block";
    if (el.id) showUpiQR(el.id);
  });
}
