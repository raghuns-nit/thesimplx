
// Contact Form Logic
async function submitContactForm(e) {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    btn.disabled = true;
    btn.innerText = "Submitting...";
    
    const enquiry = {
        id: 'ENQ_' + Date.now(),
        date: new Date().toISOString(),
        name: document.getElementById('c_name').value,
        email: document.getElementById('c_email').value,
        phone: document.getElementById('c_phone').value,
        message: document.getElementById('c_msg').value,
        status: 'Pending'
    };
    
    try {
        let enquiries = await loadJson('enquiries.json');
        enquiries.push(enquiry);
        await saveJson('enquiries.json', enquiries);
        
        document.getElementById('contactForm').reset();
        document.getElementById('successMsg').classList.remove('hidden');
    } catch(err) {
        alert("Failed to submit enquiry. Please try again.");
    } finally {
        btn.disabled = false;
        btn.innerText = "Send Message";
    }
}
