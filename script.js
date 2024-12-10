const apiKey = "your_actual_api_key";
const baseId = "your_base_id";
const tableName = "your_table_name"; // Match your Airtable table name

const url = `https://api.airtable.com/v0/${baseId}/${tableName}`;

// Fetch data from Airtable
async function fetchData() {
    const loader = document.getElementById('loader');
    loader.style.display = 'block';
    console.log("Fetching data from Airtable...");
    console.log("API URL:", url); // Debugging

    try {
        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${apiKey}` }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.statusText} (HTTP ${response.status})`);
        }

        const data = await response.json();
        console.log("Data fetched from Airtable:", data);

        if (data.records) {
            displayPlayers(data.records);
        } else {
            console.error("No records found in Airtable.");
            alert("No player data found! Check Airtable configuration.");
        }
    } catch (error) {
        console.error("Error fetching data from Airtable:", error);
        alert("Error fetching player data. Please try again later.");
    } finally {
        loader.style.display = 'none';
    }
}

// Load data on page load
document.addEventListener("DOMContentLoaded", fetchData);
