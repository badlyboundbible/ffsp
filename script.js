// Airtable API configuration
const apiKey = "patIQZcsLZw1aCILS.3d2edb2f1380092318363d8ffd99f1a695ff6db84c300d36e2be82288d4b3489";
const baseId = "appoF7fRSS4nuF9u2";
const tableName = "Table 1";
const url = `https://api.airtable.com/v0/${baseId}/${tableName}`;

// Fetch data from Airtable
async function fetchData() {
    try {
        console.log("Fetching data from Airtable...");
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Cache-Control": "no-cache"
            }
        });

        if (!response.ok) {
            throw new Error(`Fetch failed: ${response.statusText} (${response.status})`);
        }

        const data = await response.json();
        console.log("Data fetched successfully:", data);
        displayData(data.records);
    } catch (error) {
        console.error("Error fetching data:", error);
        document.getElementById("data-container").innerHTML = "<p>Error loading data.</p>";
    }
}

// Display data on the page
function displayData(records) {
    const container = document.getElementById("data-container");
    container.innerHTML = ""; // Clear existing content

    records.forEach(record => {
        const fields = record.fields;
        const { player_id, name, team, value, score } = fields;

        const playerDiv = document.createElement("div");
        playerDiv.className = "player";
        playerDiv.innerHTML = `
            <p><strong>Player ID:</strong> ${player_id}</p>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Team:</strong> ${team}</p>
            <p><strong>Value:</strong> £${value}</p>
            <p><strong>Score:</strong> ${score}</p>
        `;
        container.appendChild(playerDiv);
    });
}

// Initialize app
document.addEventListener("DOMContentLoaded", fetchData);
