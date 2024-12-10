// Airtable configuration
const apiKey = "patIQZcsLZw1aCILS.3d2edb2f1380092318363d8ffd99f1a695ff6db84c300d36e2be82288d4b3489";
const baseId = "appoF7fRSS4nuF9u2";
const tableName = "Table 1";

// Airtable API URL
const url = `https://api.airtable.com/v0/${baseId}/${tableName}`;

// Define team colors
const teamColors = {
    ABD: "#e2001a",
    CEL: "#16973b",
    HEA: "#800910",
    HIB: "#005000",
    KIL: "#0e00f7",
    MOT: "#ffbe00",
    RAN: "#1b458f",
    SMN: "#000000", // St. Mirren
    SJN: "#243f90", // St. Johnstone
    DUN: "#1a315a",
    DDU: "#f29400", // Dundee United
    ROS: "#040957", // Ross County
};

// Fetch data from Airtable
async function fetchData() {
    console.log("Fetching data from Airtable...");
    try {
        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${apiKey}` },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Data fetched:", data);

        if (data.records) {
            displayPlayers(data.records);
        }
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

// Display players on the pitch
function displayPlayers(records) {
    console.log("Displaying players...");
    // Clear all containers
    ["ells", "jacks"].forEach((team) => {
        ["gk", "def", "mid", "fwd"].forEach((position) => {
            document.getElementById(`${team}-${position}`).innerHTML = "";
        });
    });

    records.forEach((record) => {
        const { fields } = record;
        if (!fields || !fields.player_id) return;

        const { player_id, name = "Unknown", team = "N/A", value = "0.0", score = "0", bench = false } = fields;
        const isEll = player_id.startsWith("ell");
        const teamPrefix = isEll ? "ells" : "jacks";
        const positionType = player_id.split("-")[1];

        const playerDiv = document.createElement("div");
        playerDiv.className = "player";

        // Position Circle
        const positionCircle = document.createElement("div");
        positionCircle.className = "position-circle";
        positionCircle.textContent = positionType.toUpperCase();
        positionCircle.style.backgroundColor = bench ? "#cccccc" : (teamColors[team] || "#cccccc");
        positionCircle.dataset.id = record.id;
        positionCircle.dataset.bench = bench.toString(); // Store bench status as a string
        positionCircle.dataset.team = team; // Store team for color changes
        positionCircle.addEventListener("click", () => toggleBenchStatus(positionCircle));
        playerDiv.appendChild(positionCircle);

        // Player Name Input
        const nameInput = document.createElement("input");
        nameInput.value = name;
        nameInput.placeholder = "Name";
        nameInput.dataset.field = "name";
        nameInput.dataset.id = record.id;
        nameInput.addEventListener("blur", handleInputChange);
        playerDiv.appendChild(nameInput);

        // Team Dropdown
        const teamSelect = document.createElement("select");
        teamSelect.dataset.field = "team";
        teamSelect.dataset.id = record.id;
        ["ABD", "CEL", "HEA", "HIB", "KIL", "MOT", "RAN", "SMN", "SJN", "DUN", "DDU", "ROS"].forEach((teamOption) => {
            const option = document.createElement("option");
            option.value = teamOption;
            option.textContent = teamOption;
            if (teamOption === team) option.selected = true;
            teamSelect.appendChild(option);
        });
        teamSelect.addEventListener("change", (event) => {
            handleInputChange(event);
            updateCircleColor(teamSelect, positionCircle);
        });
        playerDiv.appendChild(teamSelect);

        // Value Input
        const valueInput = document.createElement("input");
        valueInput.value = value;
        valueInput.placeholder = "Value (£)";
        valueInput.dataset.field = "value";
        valueInput.dataset.id = record.id;
        valueInput.addEventListener("blur", handleInputChange);
        playerDiv.appendChild(valueInput);

        // Score Input
        const scoreInput = document.createElement("input");
        scoreInput.value = score;
        scoreInput.placeholder = "Score";
        scoreInput.dataset.field = "score";
        scoreInput.dataset.id = record.id;
        scoreInput.addEventListener("blur", handleInputChange);
        playerDiv.appendChild(scoreInput);

        // Append playerDiv to the appropriate position container
        const container = document.getElementById(`${teamPrefix}-${positionType}`);
        if (container) container.appendChild(playerDiv);
    });
}

// Toggle bench status and update Airtable
async function toggleBenchStatus(circle) {
    const recordId = circle.dataset.id;
    const currentBenchStatus = circle.dataset.bench === "true"; // Current bench status
    const newBenchStatus = !currentBenchStatus; // Toggle the status

    // Update the circle color
    circle.dataset.bench = newBenchStatus.toString();
    circle.style.backgroundColor = newBenchStatus ? "#cccccc" : (teamColors[circle.dataset.team] || "#cccccc");

    // Update Airtable
    const payload = {
        fields: { bench: newBenchStatus },
    };

    try {
        const response = await fetch(`${url}/${recordId}`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`Failed to update Airtable: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`Successfully updated bench status for record ${recordId}:`, data);
    } catch (error) {
        console.error(`Error updating bench status for record ${recordId}:`, error);
    }
}

// Update the circle color based on the selected team
function updateCircleColor(teamSelect, positionCircle) {
    const selectedTeam = teamSelect.value;
    const isBench = positionCircle.dataset.bench === "true"; // Check if the player is benched
    positionCircle.dataset.team = selectedTeam; // Update stored team
    positionCircle.style.backgroundColor = isBench ? "#cccccc" : (teamColors[selectedTeam] || "#cccccc");
}

// Handle updates to player fields
async function handleInputChange(event) {
    const input = event.target;
    const recordId = input.dataset.id;
    const field = input.dataset.field;
    const value = input.value;

    console.log(`Updating ${field} for record ${recordId} with value: ${value}`);

    const payload = {
        fields: {
            [field]: isNaN(value) ? value : parseFloat(value),
        },
    };

    try {
        const response = await fetch(`${url}/${recordId}`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`Failed to update Airtable: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`Successfully updated ${field} for record ${recordId}:`, data);
    } catch (error) {
        console.error(`Error updating ${field} for record ${recordId}:`, error);
    }
}

// Calculate the winner and update individual scores
function calculateWinner() {
    let ellScore = 0;
    let jackScore = 0;

    document.querySelectorAll(".player").forEach((player) => {
        const score = parseFloat(player.querySelector("input[data-field='score']").value) || 0;
        if (player.parentElement.id.startsWith("ells")) ellScore += score;
        if (player.parentElement.id.startsWith("jacks")) jackScore += score;
    });

    document.getElementById("jacks-score").textContent = `Jack's Score: ${jackScore}`;
    document.getElementById("ells-score").textContent = `Ell's Score: ${ellScore}`;

    const winnerDisplay = document.getElementById("winner-display");
    winnerDisplay.textContent = ellScore > jackScore
        ? "Winner: Ell's Allstars"
        : jackScore > ellScore
        ? "Winner: Jack's Team"
        : "Winner: Draw";
}

// Load data on page load
document.addEventListener("DOMContentLoaded", fetchData);
