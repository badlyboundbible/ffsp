// Replace these with your actual values from Airtable
const apiKey = "your_actual_api_key"; // Your Airtable API Key
const baseId = "your_base_id";        // Your Airtable Base ID
const tableName = "Table 1";          // Your Airtable Table Name (check case sensitivity)

// Construct the Airtable API URL
const url = `https://api.airtable.com/v0/${baseId}/${tableName}`;

// Function to fetch data from Airtable
async function fetchData() {
    console.log("Fetching data from Airtable...");
    console.log("API URL:", url); // This logs the API URL to check for correctness

    try {
        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${apiKey}` },
        });

        if (!response.ok) {
            throw new Error(
                `Failed to fetch data: ${response.statusText} (HTTP ${response.status})`
            );
        }

        const data = await response.json();
        console.log("Data fetched successfully:", data);

        if (data.records) {
            displayPlayers(data.records);
        } else {
            alert("No player data found in Airtable.");
        }
    } catch (error) {
        console.error("Error fetching data:", error);
        alert(
            "Unable to fetch data from Airtable. Please check the configuration and try again."
        );
    }
}

// Display players on the page
function displayPlayers(records) {
    console.log("Displaying players...");
    records.forEach((record) => {
        console.log(record.fields); // For debugging purposes
    });
}

// Fetch data on page load
document.addEventListener("DOMContentLoaded", fetchData);
