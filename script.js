// Airtable configuration
const apiKey = "patIQZcsLZw1aCILS.3d2edb2f1380092318363d8ffd99f1a695ff6db84c300d36e2be82288d4b3489";
const baseId = "appoF7fRSS4nuF9u2";
const tableName = "Table 1"; // Verify this name in Airtable
const url = `https://api.airtable.com/v0/${baseId}/${tableName}`;

let unsavedChanges = []; // To track unsaved changes

// Save changes to Airtable
async function saveChanges() {
    if (unsavedChanges.length === 0) {
        console.log("No changes to save.");
        return;
    }

    // Ensure all fields are formatted correctly before sending
    const validatedChanges = unsavedChanges.map((change) => {
        const validatedFields = { ...change.fields };

        // Convert "bench" field to boolean
        if (validatedFields.bench !== undefined) {
            validatedFields.bench = !!validatedFields.bench; // Ensure true/false
        }

        return {
            id: change.id,
            fields: validatedFields,
        };
    });

    console.log("Validated changes to send:", validatedChanges);

    try {
        const response = await fetch(url, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ records: validatedChanges }),
        });

        if (!response.ok) {
            const errorDetails = await response.json();
            console.error("Airtable Error Details:", errorDetails);
            throw new Error(`Failed to save changes: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Changes saved successfully:", data);
        unsavedChanges = []; // Clear changes
    } catch (error) {
        console.error("Error saving changes:", error);
    }
}

// Test with a simplified hardcoded payload
async function testAirtable() {
    const testPayload = [
        {
            id: "recXXXXXXX", // Replace with an actual record ID from Airtable
            fields: {
                bench: true, // Test updating the bench status
            },
        },
    ];

    console.log("Testing Airtable with payload:", testPayload);

    try {
        const response = await fetch(url, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ records: testPayload }),
        });

        if (!response.ok) {
            const errorDetails = await response.json();
            console.error("Airtable Error Details:", errorDetails);
            throw new Error(`Test failed: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Test successful:", data);
    } catch (error) {
        console.error("Error in test:", error);
    }
}

// Attach test to a button or run directly for debugging
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("test-button").addEventListener("click", testAirtable); // Add a test button for manual testing
});
