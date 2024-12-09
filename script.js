// Airtable configuration
const apiKey = "patIQZcsLZw1aCILS.3d2edb2f1380092318363d8ffd99f1a695ff6db84c300d36e2be82288d4b3489";
const baseId = "appoF7fRSS4nuF9u2";
const tableName = "Table 1";
const url = `https://api.airtable.com/v0/${baseId}/${tableName}`;

// Team colors
const teamColors = {
    ABD: "#e2001a",
    CEL: "#16973b",
    HEA: "#800910",
    HIB: "#005000",
    KIL: "#2f368f",
    MOT: "#ffbe00",
    RAN: "#0e00f7",
    SMN: "#000000",
    SJN: "#243f90",
    DUN: "#1a315a",
    DDU: "#f29400",
    ROS: "#040957"
};

// Fetch data from Airtable
async function fetchData() {
    console.log("Fetching data...");
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
        console.log("Data fetched:", data);

        if (data.records && data.records.length > 0) {
            displayPlayers(data.records);
        } else {
            console.error("No records found in Airtable.");
        }
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

// Display players on the pitch
function displayPlayers(records) {
    console.log("Displaying players...");
    // Clear containers for both teams
    ["ells", "jacks"].forEach(team => {
        ["gk", "def", "mid", "fwd"].forEach(position => {
            const container = document.getElementById(`${team}-${position}`);
            if (container) container.innerHTML = ""; // Clear existing content
        });
    });

    records.forEach(record => {
        const fields = record.fields;

        if (!fields || !fields.player_id) {
            console.warn("Skipping record with missing player_id:", record);
            return;
        }

        const { id } = record;
        const { player_id, name = "Unknown", team = "N/A", value = "0.0", score = "0" } = fields;

        const isEll = player_id.startsWith("ell");
        const teamPrefix = isEll ? "ells" : "jacks";
        const positionType = player_id.split("-")[1];

        const playerDiv = document.createElement("div");
        playerDiv.className = "player";

        // Get team color or default to gray
        const teamColor = teamColors[team.trim()] || "#cccccc";

        // Build player card
        playerDiv.innerHTML = `
            <div class="position-circle" style="background-color: ${teamColor};">
                ${getPositionAbbreviation(player_id)}
            </div>
            <input data-id="${id}" data-field="name" value="${name}" placeholder="Name" />
            <select data-id="${id}" data-field="team">
                ${Object.keys(teamColors)
                    .map(
                        teamKey =>
                            `<option value="${teamKey}" ${
                                teamKey === team.trim() ? "selected" : ""
                            }>${teamKey}</option>`
                    )
                    .join("")}
            </select>
            <input data-id="${id}" data-field="value" value="${value}" placeholder="Value (£)" />
            <input data-id="${id}" data-field="score" value="${score}" placeholder="Score" />
        `;

        // Attach event listeners
        playerDiv.querySelectorAll("input, select").forEach(input => {
            input.addEventListener("blur", handleInputChange);
        });

        // Append to correct position container
        const positionContainer = document.getElementById(`${teamPrefix}-${positionType}`);
        if (positionContainer) {
            positionContainer.appendChild(playerDiv);
        } else {
            console.warn(`Invalid position: ${positionType} for player ${player_id}`);
        }
    });
}

// Determine position abbreviation
function getPositionAbbreviation(playerId) {
    if (playerId.includes("gk")) return "G";
    if (playerId.includes("def")) return "D";
    if (playerId.includes("mid")) return "M";
    if (playerId.includes("fwd")) return "F";
    return "?";
}

// Update Airtable when inputs or dropdowns change
async function handleInputChange(event) {
    const input = event.target;
    const recordId = input.dataset.id;
    const field = input.dataset.field;
    const value = input.value;

    console.log(`Updating ${field} for record ${recordId} with value: ${value}`);

    try {
        const response = await fetch(`${url}/${recordId}`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ fields: { [field]: isNaN(value) ? value : parseFloat(value) } })
        });

        if (!response.ok) {
            throw new Error(`Update failed: ${response.statusText} (${response.status})`);
        }

        console.log("Update successful:", await response.json());
    } catch (error) {
        console.error(`Error updating ${field} for record ${recordId}:`, error);
    }
}

// Initialize app
document.addEventListener("DOMContentLoaded", fetchData);
