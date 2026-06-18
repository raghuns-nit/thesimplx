
// UPI Integration
function payAdvance(amount = '') {
    if(!globalSettings.upiId) {
        alert("UPI details are not configured by the administrator.");
        return;
    }
    
    const upiId = globalSettings.upiId;
    const name = globalSettings.companyName || 'Merchant';
    
    let link = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&cu=INR`;
    if(amount) {
        link += `&am=${amount}`;
    }
    
    // Redirect to intent
    window.location.href = link;
    
    // Fallback message for desktop
    setTimeout(() => {
        alert(`If the UPI app didn't open, please scan the QR code or pay to UPI ID: ${upiId}`);
    }, 2000);
}
