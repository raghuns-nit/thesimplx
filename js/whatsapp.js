// ============================================================
// whatsapp.js — WhatsApp redirects + Supabase enquiry logging
// Depends on supabase-client.js, storage.js
// ============================================================

let waCurrentProduct = null;

function openGeneralWhatsApp() {
  waCurrentProduct = null;
  openWaModal();
}

function requestQuote(product) {
  waCurrentProduct = product;
  openWaModal();
}

function openWaModal() {
  const modal = document.getElementById('waLeadModal');
  if (modal) modal.classList.add('active');
}

function closeWaModal() {
  const modal = document.getElementById('waLeadModal');
  if (modal) modal.classList.remove('active');
  const nameEl = document.getElementById('waLeadName');
  const phoneEl = document.getElementById('waLeadPhone');
  if (nameEl) nameEl.value = '';
  if (phoneEl) phoneEl.value = '';
}

async function submitWaLead() {
  const nameEl = document.getElementById('waLeadName');
  const phoneEl = document.getElementById('waLeadPhone');

  const name = nameEl ? nameEl.value.trim() : '';
  const phone = phoneEl ? phoneEl.value.trim() : '';

  if (!name || !phone) {
    alert('Please enter your name and phone number so we can assist you better.');
    return;
  }

  const waTab = window.open('about:blank', '_blank');

  const btn = document.querySelector('#waLeadModal .btn-whatsapp');
  const originalText = btn ? btn.innerText : '';
  if (btn) btn.innerText = 'Connecting...';

  try {
    // Log the enquiry to Supabase
    let automatedMessage = 'General WhatsApp Enquiry';
    if (waCurrentProduct) {
      automatedMessage = `WhatsApp Quote Request for: ${waCurrentProduct.name} (SKU: ${waCurrentProduct.sku || '—'})`;
    }

    await insertEnquiry({
      name,
      email: null,
      phone,
      message: automatedMessage,
    });

    // Get WhatsApp number from settings
    let waNumber = '919876543210';
    try {
      const settings = await loadSettings();
      if (settings && settings.whatsapp) {
        waNumber = settings.whatsapp.replace(/\D/g, '');
      }
    } catch (err) {
      console.warn('Could not load settings for WhatsApp number.');
    }

    let chatText = `Hi, my name is ${name}. `;
    if (waCurrentProduct) {
      chatText += `I would like a quote for ${waCurrentProduct.name} (SKU: ${waCurrentProduct.sku || '—'}).`;
    } else {
      chatText += 'I have a general enquiry about your products.';
    }

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const waUrl = isMobile
      ? `https://wa.me/${waNumber}?text=${encodeURIComponent(chatText)}`
      : `https://web.whatsapp.com/send?phone=${waNumber}&text=${encodeURIComponent(chatText)}`;

    waTab.location.href = waUrl;
    closeWaModal();
  } catch (error) {
    console.error('Failed to log WhatsApp lead:', error);
    if (waTab) waTab.close();
    alert('There was an issue connecting. Please try again.');
  } finally {
    if (btn) btn.innerText = originalText;
  }
}
