// Airtable configuration
const apiKey = "patIQZcsLZw1aCILS.3d2edb2f1380092318363d8ffd99f1a695ff6db84c300d36e2be82288d4b3489";
const baseId = "appoF7fRSS4nuF9u2";
const tableName = "Table 1";
const url = `https://api.airtable.com/v0/${baseId}/${tableName}`;

// Fetch data from Airtable
async function fetchData() {
    console.log("Attempting to fetch data from Airtable...");
    try {
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

        if (data.records && data.records.length > 0) {
            displayPlayers(data.records);
        } else {
            console.warn("No records found in Airtable.");
        }
    } catch (error) {
        console.error("Error fetching data from Airtable:", error);
        const container = document.getElementById("data-container");
        container.innerHTML = "<p>Failed to load data. Check the console for details.</p>";
    }
}

// Display players on the page
function displayPlayers(records) {
    console.log("Rendering players...");
    const ellContainer = document.getElementById("ells-fwd"); // Display Ell's data here for testing
    const jackContainer = document.getElementById("jacks-fwd"); // Display Jack's data here for testing

    ellContainer.innerHTML = ""; // Clear the container
    jackContainer.innerHTML = ""; // Clear the container

    records.forEach(record => {
        const { player_id, name = "Unknown", team = "N/A", value = "0.0", score = "0" } = record.fields || {};
        if (!player_id) {
            console.warn("Skipping record with missing player_id:", record);
            return;
        }

        // Create a basic player card
        const playerDiv = document.createElement("div");
        playerDiv.className = "player";
        playerDiv.innerHTML = `
            <p>Player ID: ${player_id}</p>
            <p>Name: ${name}</p>
            <p>Team: ${team}</p>
            <p>Value: £${value}</p>
            <p>Score: ${score}</p>
        `;

        // Append to the appropriate container
        if (player_id.startsWith("ell")) {
            ellContainer.appendChild(playerDiv);
        } else if (player_id.startsWith("jack")) {
            jackContainer.appendChild(playerDiv);
        }
    });
}

// Initialize app
document.addEventListener("DOMContentLoaded", () => {
    fetchData();
});
