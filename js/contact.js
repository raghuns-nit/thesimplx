
async function submitToGoogleForms(event) {
    // Stop the page from refreshing immediately
    event.preventDefault();
    
    try {
        // 1. Get your specific Google Form action URL
       const formUrl = "https://docs.google.com/forms/d/e/15APs68u20ScuqRkONj9KNqhRfZyPe97gPs6lzO5wkDw/formResponse";
    
    // 2. Gather the data from your HTML inputs
    const name = document.getElementById('contactName').value;
    const email = document.getElementById('contactEmail').value;
    const phone = document.getElementById('contactPhone').value;
    const message = document.getElementById('contactMessage').value;

    // 3. Map the data to your specific entry IDs from Step 1
    const formData = new FormData();
    formData.append("entry.2082304499", name);    // Replace with your Name entry ID
    formData.append("entry.140362742", email);   // Replace with your Email entry ID
    formData.append("entry.516630700", phone);   // Replace with your Phone entry ID
    formData.append("entry.1706491249", message); // Replace with your Message entry ID

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
