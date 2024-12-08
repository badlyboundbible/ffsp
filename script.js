async function handleInputChange(event) {
    const input = event.target;
    const recordId = input.dataset.id; // Record ID in Airtable
    const field = input.dataset.field; // Field being updated (e.g., "name", "score", etc.)
    const value = input.value; // New value entered by the user

    console.log(`Updating ${field} for record ${recordId} with value: ${value}`);

    // Prepare the data payload for Airtable
    const payload = {
        fields: {
            [field]: isNaN(value) ? value : parseFloat(value) // Convert numbers if applicable
        }
    };

    try {
        const response = await fetch(`${url}/${recordId}`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            console.log(`Successfully updated ${field} for record ${recordId}:`, data);
        } else {
            console.error(`Error updating ${field} for record ${recordId}:`, data.error);
        }
    } catch (error) {
        console.error(`Network error while updating ${field} for record ${recordId}:`, error);
    }
}
