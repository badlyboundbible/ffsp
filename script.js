// Airtable configuration
const apiKey = "patIQZcsLZw1aCILS.3d2edb2f1380092318363d8ffd99f1a695ff6db84c300d36e2be82288d4b3489";
const baseId = "appoF7fRSS4nuF9u2";
const tableName = "Table 1";
const url = `https://api.airtable.com/v0/${baseId}/${tableName}`;

// Fetch data from Airtable
async function fetchData() {
    try {
        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${apiKey}` }
        });
        const data = await response.json();
        displayPlayers(data.records);
    } catch (error) {
        console.error("Error fetching data:", error);
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
        const { player_id, name, team, value, score } = record.fields;

        // Determine team and position
        const isEll = player_id.startsWith("ell");
        const teamPrefix = isEll ? "ells" : "jacks";
        const position = player_id.split("-")[1]; // e.g., gk, def, mid, fwd

        // Create player card
        const playerDiv = document.createElement("div");
        playerDiv.className = "player";
        playerDiv.innerHTML = `
            <input value="${name}" placeholder="Name" />
            <input value="${team}" placeholder="Team" />
            <input value="${value}" placeholder="Value (£)" />
            <input value="${score}" placeholder="Score" />
        `;

        // Append player card to correct position
        document.getElementById(`${teamPrefix}-${position}`).appendChild(playerDiv);
    });
}

// Calculate the winner
function calculateWinner() {
    let ellScore = 0;
    let jackScore = 0;

    document.querySelectorAll(".player").forEach(player => {
        const score = parseFloat(player.querySelector("input:nth-child(4)").value) || 0;
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
