// Fetch data from the Netlify function
async function fetchData() {
    const url = "https://tiny-sunshine-396523.netlify.app/.netlify/functions/airtable-proxy";

    try {
        console.log("Fetching data...");
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.statusText} (${response.status})`);
        }

        const data = await response.json();
        console.log("Data fetched successfully:", data);
        displayData(data.records);
    } catch (error) {
        console.error("Error fetching data:", error);
        document.getElementById("data-container").innerHTML = "<p>Error loading data.</p>";
    }
}

// Display data in the app
function displayData(records) {
    const container = document.getElementById("data-container");
    container.innerHTML = ""; // Clear existing content

    records.forEach(record => {
        const fields = record.fields;
        const { player_id, name, team, value, score } = fields;

        const playerDiv = document.createElement("div");
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

// Fetch data when the page loads
document.addEventListener("DOMContentLoaded", fetchData);
