// ============================================================
// whatsapp.js — Handles WhatsApp redirects and silent lead capture
// ============================================================

// Global variable to remember which product they clicked
let waCurrentProduct = null;

// 1. Triggered by the floating chat bubble (General Enquiry)
function openGeneralWhatsApp() {
    waCurrentProduct = null; 
    openWaModal();
}

// 2. Triggered by the "Request Quote" button on a product page
function requestQuote(product) {
    waCurrentProduct = product;
    openWaModal();
}

// 3. Open the Modal
function openWaModal() {
    const modal = document.getElementById('waLeadModal');
    if (modal) modal.classList.add('active');
}

// 4. Close the Modal and clear inputs
function closeWaModal() {
    const modal = document.getElementById('waLeadModal');
    if (modal) modal.classList.remove('active');
    
    // Reset the fields
    const nameEl = document.getElementById('waLeadName');
    const phoneEl = document.getElementById('waLeadPhone');
    if (nameEl) nameEl.value = '';
    if (phoneEl) phoneEl.value = '';
}

// 5. The core function: Capture lead, send to Sheet, redirect to WhatsApp
async function submitWaLead() {
    const nameEl = document.getElementById('waLeadName');
    const phoneEl = document.getElementById('waLeadPhone');

    const name = nameEl ? nameEl.value.trim() : '';
    const phone = phoneEl ? phoneEl.value.trim() : '';

    if (!name || !phone) {
        alert("Please enter your name and phone number so we can assist you better.");
        return;
    }

    // THE POPUP BYPASS TRICK: Open a blank trusted tab immediately upon click
    const waTab = window.open('about:blank', '_blank');

    const btn = document.querySelector('#waLeadModal .btn-whatsapp');
    const originalText = btn.innerText;
    btn.innerText = "Connecting...";

    try {
        // ---------------------------------------------------------
        // STEP A: SILENTLY LOG TO GOOGLE SHEETS
        // ---------------------------------------------------------
        const formUrl = "https://docs.google.com/forms/d/e/1FAIpQLSdCn3sVVcksHISTRmeXgKSqtR4Jzja1A514sl8zxdw-LRTuYA/formResponse";
        
        let automatedMessage = "General WhatsApp Enquiry";
        if (waCurrentProduct) {
            automatedMessage = `WhatsApp Quote Request for: ${waCurrentProduct.name} (SKU: ${waCurrentProduct.sku})`;
        }

        const formData = new FormData();
        formData.append("entry.2082304499", name);                   
        formData.append("entry.140362742", "N/A (WhatsApp Lead)");   
        formData.append("entry.516630700", phone);                   
        formData.append("entry.1706491249", automatedMessage);       

        // Send the data invisibly
        await fetch(formUrl, {
            method: "POST",
            mode: "no-cors",
            body: formData
        });

        // ---------------------------------------------------------
        // STEP B: SMART REDIRECT TO ACTUAL WHATSAPP
        // ---------------------------------------------------------
        let waNumber = "919876543210"; // Fallback
        
        // FIX: Explicitly fetch the real number directly from your database
        try {
            const settings = await loadJson('settings.json');
            if (settings && settings.whatsapp) {
                waNumber = settings.whatsapp.replace(/\D/g, ''); // Strip spaces/dashes
            }
        } catch (err) {
            console.warn("Could not load settings.json for WhatsApp number.");
        }

        let chatText = `Hi, my name is ${name}. `;
        if (waCurrentProduct) {
            chatText += `I would like a quote for ${waCurrentProduct.name} (SKU: ${waCurrentProduct.sku}).`;
        } else {
            chatText += `I have a general enquiry about your products.`;
        }

        // Detect if the user is on a mobile phone or a desktop computer
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        // Route Desktop users straight to WhatsApp Web to avoid the protocol error
        const waUrl = isMobile 
            ? `https://wa.me/${waNumber}?text=${encodeURIComponent(chatText)}`
            : `https://web.whatsapp.com/send?phone=${waNumber}&text=${encodeURIComponent(chatText)}`;

        // Load the correct WhatsApp URL into the tab we opened earlier
        waTab.location.href = waUrl;
        
        closeWaModal();

    } catch (error) {
        console.error("Failed to log WhatsApp lead:", error);
        waTab.close(); // Close the blank tab if it fails
        alert("There was an issue connecting. Please try again.");
    } finally {
        btn.innerText = originalText;
    }
}
