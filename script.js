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
    console.log("Fetching data from Airtable...");
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
    }
}

// Display players
function displayPlayers(records) {
    console.log("Displaying players...");
    // Clear containers
    ["ells", "jacks"].forEach(team => {
        ["gk", "def", "mid", "fwd"].forEach(position => {
            const container = document.getElementById(`${team}-${position}`);
            if (container) container.innerHTML = "";
        });
    });

    records.forEach(record => {
        const fields = record.fields;
        const { player_id, name = "Unknown", team = "N/A", value = "0.0", score = "0" } = fields;

        const isEll = player_id.startsWith("ell");
        const teamPrefix = isEll ? "ells" : "jacks";
        const positionType = player_id.split("-")[1];

        const playerDiv = document.createElement("div");
        playerDiv.className = "player";

        // Team color
        const teamColor = teamColors[team.trim()] || "#cccccc";

        playerDiv.innerHTML = `
            <div class="position-circle" style="background-color: ${teamColor};">${getPositionAbbreviation(player_id)}</div>
            <p>Name: ${name}</p>
            <p>Team: ${team}</p>
            <p>Value: £${value}</p>
            <p>Score: ${score}</p>
        `;

        const container = document.getElementById(`${teamPrefix}-${positionType}`);
        if (container) container.appendChild(playerDiv);
    });
}

function getPositionAbbreviation(playerId) {
    if (playerId.includes("gk")) return "G";
    if (playerId.includes("def")) return "D";
    if (playerId.includes("mid")) return "M";
    if (playerId.includes("fwd")) return "F";
    return "?";
}

// Initialize app
document.addEventListener("DOMContentLoaded", fetchData);
