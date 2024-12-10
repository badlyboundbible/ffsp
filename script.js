// Airtable API Details
const apiKey = "your_actual_api_key"; // Replace with actual API key
const baseId = "your_base_id";        // Replace with actual base ID
const tableName = "your_table_name";  // Replace with actual table name
const url = `https://api.airtable.com/v0/${baseId}/${tableName}`;

// Add a proxy for CORS issues (if needed)
// const proxy = "https://cors-anywhere.herokuapp.com/";
// const url = `${proxy}https://api.airtable.com/v0/${baseId}/${tableName}`;

// Fetch Data from Airtable
async function fetchData() {
    const loader = document.getElementById("loader");
    loader.style.display = "block"; // Show loader while fetching data
    console.log("Fetching data from Airtable...");
    console.log("API URL:", url); // Debugging

    try {
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
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
            "Unable to fetch data from Airtable. Please check your configuration."
        );
    } finally {
        loader.style.display = "none"; // Hide loader
    }
}

// Display Players
function displayPlayers(records) {
    console.log("Displaying players...");
    records.forEach((record) => {
        console.log(record.fields); // Debug to ensure records are loaded
    });
}

// On Page Load
document.addEventListener("DOMContentLoaded", fetchData);
