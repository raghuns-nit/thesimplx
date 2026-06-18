
// WhatsApp Integration
function requestQuote(product) {
    if(!globalSettings.whatsapp) {
        alert("WhatsApp contact number is not configured.");
        return;
    }
    
    const phone = globalSettings.whatsapp.replace(/[^0-9]/g, '');
    const url = encodeURIComponent(window.location.href);
    
    const message = `Hello,

I am interested in:
Brand: ${product.brand}
Product: ${product.name}
SKU: ${product.sku}
Category: ${product.category}
Size: ${product.size || 'N/A'}
Price: ₹${product.price} / ${product.unit}
Product Link: ${window.location.href}

Please send quotation and availability.

Thank you.`;

    const waLink = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(waLink, '_blank');
}

function openGeneralWhatsApp() {
    if(!globalSettings.whatsapp) return;
    const phone = globalSettings.whatsapp.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${phone}?text=Hello,%20I%20have%20an%20enquiry.`, '_blank');
}
