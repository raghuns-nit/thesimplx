// Renamed to match the onsubmit="submitContactForm(event)" in your HTML
async function submitContactForm(event) {
    // Stop the page from refreshing immediately
    event.preventDefault();
    
    try {
        // 1. Get your specific Google Form action URL
        const formUrl = "https://docs.google.com/forms/d/e/1FAIpQLSdCn3sVVcksHISTRmeXgKSqtR4Jzja1A514sl8zxdw-LRTuYA/formResponse";
        
        // 2. Gather the data using the exact IDs from your HTML (c_name, c_email, etc.)
        const nameEl = document.getElementById('c_name');
        const emailEl = document.getElementById('c_email');
        const phoneEl = document.getElementById('c_phone');
        const messageEl = document.getElementById('c_msg');

        // Check if elements exist to prevent silent crashes
        if (!nameEl || !phoneEl || !messageEl) {
            throw new Error("One or more HTML input IDs are missing on the page.");
        }

        // 3. Map the data to your specific entry IDs
        const formData = new FormData();
        formData.append("entry.2082304499", nameEl.value);    
        formData.append("entry.140362742", emailEl ? emailEl.value : "");  // Email is optional in your HTML 
        formData.append("entry.516630700", phoneEl.value);   
        formData.append("entry.1706491249", messageEl.value); 

        // 4. Send the data silently
        await fetch(formUrl, {
            method: "POST",
            mode: "no-cors", 
            body: formData
        });

        // 5. Show success message and clear form
        alert("Thank you! Your enquiry has been received.");
        document.getElementById('contactForm').reset();

    } catch (error) {
        console.error("Error submitting form:", error);
        alert("There was an issue sending your message. Please try again.");
    }
}
