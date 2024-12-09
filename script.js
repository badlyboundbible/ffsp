// Airtable configuration
const apiKey = "patIQZcsLZw1aCILS.3d2edb2f1380092318363d8ffd99f1a695ff6db84c300d36e2be82288d4b3489";
const baseId = "appoF7fRSS4nuF9u2";
const tableName = "Table 1"; // Ensure this matches your Airtable table name

// Airtable API URL
const url = `https://api.airtable.com/v0/${baseId}/${tableName}`;

// Team colors
const teamColors = {
    ABD: "#e2001a",
    CEL: "#16973b",
    HEA: "#800910",
    HIB: "#005000",
    KIL: "#2f368f", // Updated KIL color
    MOT: "#ffbe00",
    RAN: "#0e00f7",
    SMN: "#000000", // StM changed to SMN
    SJN: "#243f90", // StJ changed to SJN
    DUN: "#1a315a",
    DDU: "#f29400",
    ROS: "#040957"
};

// Fetch data from Airtable
async function fetchData() {
    console.log("Fetching data from Airtable...");
    try {
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Cache-Control": "no-cache", // Force no-cache for Safari compatibility
            }
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
        }
    } catch (error) {
        console.error("Error fetching data from Airtable:", error);
    }
}

// Map player_id to position abbreviation
function getPositionAbbreviation(playerId) {
    if (playerId.includes("gk")) return "G";
    if (playerId.includes("def")) return "D";
    if (playerId.includes("mid")) return "M";
    if (playerId.includes("fwd")) return "F";
    return "?";
}

// Display players on the pitch
function displayPlayers(records) {
    console.log("Displaying players...");
    // Clear all containers
    ["ells", "jacks"].forEach(team => {
        ["gk", "def", "mid", "fwd"].forEach(position => {
            document.getElementById(`${team}-${position}`).innerHTML = "";
        });
    });

    // Iterate through records and display each player
    records.forEach(record => {
        const fields = record.fields;

        if (!fields || !fields.player_id) {
            console.warn("Skipping record due to missing player_id:", record);
            return;
        }

        const { id } = record;
        const { player_id, name = "Unknown", team = "N/A", value = "0.0", score = "0" } = fields;

        const isEll = player_id.startsWith("ell");
        const teamPrefix = isEll ? "ells" : "jacks";
        const positionType = player_id.split("-")[1];
        const positionAbbreviation = getPositionAbbreviation(player_id);

        const playerDiv = document.createElement("div");
        playerDiv.className = "player";

        // Get team color or default to gray
        const teamColor = teamColors[team.trim()] || "#cccccc";

        // Build dropdown options for team
        const teamOptions = Object.keys(teamColors)
            .map(
                teamKey =>
                    `<option value="${teamKey}" ${teamKey === team.trim() ? "selected" : ""}>${teamKey}</option>`
            )
            .join("");

        // Render player card
        playerDiv.innerHTML = `
            <div class="position-circle" style="background-color: ${teamColor};">
                ${positionAbbreviation}
            </div>
            <input data-id="${id}" data-field="name" value="${name}" placeholder="Name" />
            <select data-id="${id}" data-field="team">${teamOptions}</select>
            <input data-id="${id}" data-field="value" value="${value}" placeholder="Value (£)" />
            <input data-id="${id}" data-field="score" value="${score}" placeholder="Score" />
        `;

        // Attach event listeners for inputs and dropdowns
        playerDiv.querySelectorAll("input").forEach(input => {
            input.addEventListener("blur", handleInputChange); // Update on blur
        });

        playerDiv.querySelectorAll("select").forEach(select => {
            select.addEventListener("change", handleInputChange); // Update on change
        });

        // Append to appropriate team and position container
        const positionContainer = document.getElementById(`${teamPrefix}-${positionType}`);
        if (positionContainer) {
            positionContainer.appendChild(playerDiv);
        } else {
            console.warn(`Invalid position: ${positionType} for player ${player_id}`);
        }
    });
}

// Handle input and dropdown changes
async function handleInputChange(event) {
    const input = event.target;
    const recordId = input.dataset.id; // Airtable record ID
    const field = input.dataset.field; // Field to update
    const value = input.value; // New value

    console.log(`Updating ${field} for record ${recordId} with value: ${value}`);

    const payload = {
        fields: {
            [field]: isNaN(value) ? value : parseFloat(value) // Convert numbers to float
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

        if (!response.ok) {
            throw new Error(`Failed to update Airtable: ${response.statusText} (HTTP ${response.status})`);
        }

        const data = await response.json();
        console.log(`Successfully updated ${field} for record ${recordId}:`, data);
    } catch (error) {
        console.error(`Error updating ${field} for record ${recordId}:`, error);
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
        winnerDisplay.textContent = "Winner: Lord Frostly's XI";
    } else {
        winnerDisplay.textContent = "Winner: Draw";
    }
}

// Load data on page load
document.addEventListener("DOMContentLoaded", fetchData);
