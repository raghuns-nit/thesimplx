// ============================================================
// contact.js — Submit contact form to Supabase enquiries table
// Depends on supabase-client.js, storage.js
// ============================================================

async function submitContactForm(event) {
  event.preventDefault();

  const nameEl = document.getElementById('c_name');
  const emailEl = document.getElementById('c_email');
  const phoneEl = document.getElementById('c_phone');
  const messageEl = document.getElementById('c_msg');

  if (!nameEl || !phoneEl || !messageEl) {
    alert('One or more form fields are missing on the page.');
    return;
  }

  const name = nameEl.value.trim();
  const email = emailEl ? emailEl.value.trim() : '';
  const phone = phoneEl.value.trim();
  const message = messageEl.value.trim();

  if (!name || !phone || !message) {
    alert('Please fill in your name, phone number, and message.');
    return;
  }

  try {
    const result = await insertEnquiry({ name, email: email || null, phone, message });
    if (!result) {
      alert('There was an issue sending your message. Please try again.');
      return;
    }

    alert('Thank you! Your enquiry has been received.');
    document.getElementById('contactForm').reset();
  } catch (error) {
    console.error('Error submitting form:', error);
    alert('There was an issue sending your message. Please try again.');
  }
}
