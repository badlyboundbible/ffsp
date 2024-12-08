// Your Airtable configuration
const apiKey = "patIQZcsLZw1aCILS.3d2edb2f1380092318363d8ffd99f1a695ff6db84c300d36e2be82288d4b3489";
const baseId = "appoF7fRSS4nuF9u2";
const tableName = "Table 1"; // Change if your table has a different name

// Airtable API URLs
const url = `https://api.airtable.com/v0/${baseId}/${tableName}`;

// Fetch data from Airtable
async function fetchData() {
    try {
        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${apiKey}` }
        });
        const data = await response.json();

        console.log("Airtable Response:", data); // Log the raw response

        if (data.records) {
            displayPlayers(data.records);
        } else {
            console.error("Error fetching Airtable data:", data.error);
        }
    } catch (error) {
        console.error("Network error:", error);
    }
}

// Display players on the pitch
function displayPlayers(records) {
    // Clear existing players
    ["ells", "jacks"].forEach(team => {
        ["gk", "def", "mid", "fwd"].forEach(position => {
            document.getElementById(`${team}-${position}`).innerHTML = "";
        });
    });

    records.forEach(record => {
        const fields = record.fields;

        // Check if fields and player_id exist
        if (!fields || !fields.player_id) {
            console.warn("Skipping record due to missing player_id:", record);
            return;
        }

        const { id } = record; // Airtable record ID
        const { player_id, name = "Unknown", team = "N/A", value = "0.0", score = "0" } = fields;

        // Determine team and position
        const isEll = player_id.startsWith("ell");
        const teamPrefix = isEll ? "ells" : "jacks";
        const position = player_id.split("-")[1]; // e.g., gk, def, mid, fwd

        // Create player card
        const playerDiv = document.createElement("div");
        playerDiv.className = "player";
        playerDiv.innerHTML = `
            <input data-id="${id}" data-field="name" value="${name}" placeholder="Name" />
            <input data-id="${id}" data-field="team" value="${team}" placeholder="Team" />
            <input data-id="${id}" data-field="value" value="${value}" placeholder="Value (£)" />
            <input data-id="${id}" data-field="score" value="${score}" placeholder="Score" />
        `;

        // Attach event listeners for updating data
        playerDiv.querySelectorAll("input").forEach(input => {
            input.addEventListener("change", handleInputChange);
        });

        // Append player card to correct position
        const positionContainer = document.getElementById(`${teamPrefix}-${position}`);
        if (positionContainer) {
            positionContainer.appendChild(playerDiv);
        } else {
            console.warn(`Invalid position: ${position} for player ${player_id}`);
        }
    });
}

// Handle input changes and update Airtable
async function handleInputChange(event) {
    const input = event.target;
    const recordId = input.dataset.id; // Airtable record ID
    const field = input.dataset.field; // Field to update (e.g., name, team, etc.)
    const value = input.value; // New value

    try {
        const response = await fetch(`${url}/${recordId}`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                fields: {
                    [field]: value
                }
            })
        });

        const data = await response.json();

        if (response.ok) {
            console.log(`Updated ${field} for record ${recordId}:`, data);
        } else {
            console.error("Error updating Airtable:", data.error);
        }
    } catch (error) {
        console.error("Network error while updating Airtable:", error);
    }
}

// Calculate the winner
function calculateWinner() {
    let ellScore = 0;
    let jackScore = 0;

    document.querySelectorAll(".player").forEach(player => {
        const score = parseFloat(player.querySelector("input[data-field='score']").value) || 0;
        if (player.parentElement.id.startsWith("ells")) {
            ellScore += score;
        } else {
            jackScore += score;
        }
    });

    const winnerDisplay = document.getElementById("winner-display");
    if (ellScore > jackScore) {
        winnerDisplay.textContent = "Winner: Ell's Allstars";
    } else if (jackScore > ellScore) {
        winnerDisplay.textContent = "Winner: Jack's Team";
    } else {
        winnerDisplay.textContent = "Winner: Draw";
    }
}

// Load players on page load
document.addEventListener("DOMContentLoaded", fetchData);
