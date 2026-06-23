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

    // Give visual feedback that it is processing
    const btn = document.querySelector('#waLeadModal .btn-whatsapp');
    const originalText = btn.innerText;
    btn.innerText = "Connecting...";

    try {
        // ---------------------------------------------------------
        // STEP A: SILENTLY LOG TO GOOGLE SHEETS
        // ---------------------------------------------------------
        // ⚠️ REPLACE THIS URL WITH YOUR ACTUAL PUBLIC "1FAIp..." URL
        const formUrl = "https://docs.google.com/forms/d/e/1FAIpQLSdCn3sVVcksHISTRmeXgKSqtR4Jzja1A514sl8zxdw-LRTuYA/formResponse";
        
        // Build the automated message based on what they clicked
        let automatedMessage = "General WhatsApp Enquiry";
        if (waCurrentProduct) {
            automatedMessage = `WhatsApp Quote Request for: ${waCurrentProduct.name} (SKU: ${waCurrentProduct.sku})`;
        }

        const formData = new FormData();
        // Use the exact same entry IDs from your contact.js file
        formData.append("entry.2082304499", name);                   // Name
        formData.append("entry.140362742", "N/A (WhatsApp Lead)");   // Email (Placeholder so sheet looks neat)
        formData.append("entry.516630700", phone);                   // Phone
        formData.append("entry.1706491249", automatedMessage);       // Message

        // Send the data invisibly
        await fetch(formUrl, {
            method: "POST",
            mode: "no-cors",
            body: formData
        });

        // ---------------------------------------------------------
        // STEP B: REDIRECT TO ACTUAL WHATSAPP
        // ---------------------------------------------------------
        
        // Fallback number just in case settings haven't loaded
        let waNumber = "919876543210"; 
        
        // Grab the official WhatsApp number from your settings.json
        if (window.globalSettings && window.globalSettings.whatsapp) {
            waNumber = window.globalSettings.whatsapp.replace(/\D/g, ''); // Strip out any spaces or dashes
        }

        // Build the pre-filled chat text for the customer
        let chatText = `Hi, my name is ${name}. `;
        if (waCurrentProduct) {
            chatText += `I would like a quote for ${waCurrentProduct.name} (SKU: ${waCurrentProduct.sku}).`;
        } else {
            chatText += `I have a general enquiry about your products.`;
        }

        // Create the official wa.me link
        const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(chatText)}`;

      // Cleanup the modal
        closeWaModal();
        
        // Use location.href to bypass pop-up blockers seamlessly!
        window.location.href = waUrl;

    } catch (error) {
        console.error("Failed to log WhatsApp lead:", error);
        alert("There was an issue connecting. Please try again.");
    } finally {
        // Reset the button text
        btn.innerText = originalText;
    }
}
