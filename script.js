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
    SMN: "#000000",
    SJN: "#243f90",
    DUN: "#1a315a",
    DDU: "#f29400",
    ROS: "#040957",
};

// Local cache for unsaved changes
let unsavedChanges = [];

// Fetch data from Airtable
async function fetchData() {
    try {
        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${apiKey}` },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.records) {
            displayPlayers(data.records);
        }
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

// Display players on the pitch
function displayPlayers(records) {
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

        const positionCircle = document.createElement("div");
        positionCircle.className = "position-circle";
        positionCircle.textContent = positionType.toUpperCase();
        positionCircle.style.backgroundColor = bench ? "#888888" : (teamColors[team] || "#cccccc");
        positionCircle.dataset.id = record.id;
        positionCircle.dataset.bench = bench;
        positionCircle.dataset.team = team;
        positionCircle.addEventListener("click", () => toggleBenchStatus(positionCircle));
        playerDiv.appendChild(positionCircle);

        const nameInput = document.createElement("input");
        nameInput.value = name;
        nameInput.placeholder = "Name";
        nameInput.dataset.field = "name";
        nameInput.dataset.id = record.id;
        nameInput.addEventListener("blur", handleInputChange);
        playerDiv.appendChild(nameInput);

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

        const valueInput = document.createElement("input");
        valueInput.value = `£${parseFloat(value).toFixed(2)}`;
        valueInput.placeholder = "Value (£)";
        valueInput.dataset.field = "value";
        valueInput.dataset.id = record.id;
        valueInput.addEventListener("blur", handleInputChange);
        playerDiv.appendChild(valueInput);

        const scoreInput = document.createElement("input");
        scoreInput.value = score;
        scoreInput.placeholder = "Score";
        scoreInput.dataset.field = "score";
        scoreInput.dataset.id = record.id;
        scoreInput.addEventListener("blur", handleInputChange);
        playerDiv.appendChild(scoreInput);

        const container = document.getElementById(`${teamPrefix}-${positionType}`);
        if (container) container.appendChild(playerDiv);
    });
}

// Toggle bench status
function toggleBenchStatus(circle) {
    const recordId = circle.dataset.id;
    const currentBenchStatus = circle.dataset.bench === "true";
    const newBenchStatus = !currentBenchStatus;

    circle.dataset.bench = newBenchStatus;
    circle.style.backgroundColor = newBenchStatus ? "#888888" : teamColors[circle.dataset.team] || "#cccccc";

    unsavedChanges.push({
        id: recordId,
        fields: { bench: newBenchStatus },
    });
}

// Update the circle color
function updateCircleColor(teamSelect, positionCircle) {
    const selectedTeam = teamSelect.value;
    const isBench = positionCircle.dataset.bench === "true";
    positionCircle.dataset.team = selectedTeam;
    positionCircle.style.backgroundColor = isBench ? "#888888" : teamColors[selectedTeam] || "#cccccc";
}

// Handle updates to player fields
function handleInputChange(event) {
    const input = event.target;
    const recordId = input.dataset.id;
    const field = input.dataset.field;
    const value = input.dataset.field === "value" ? parseFloat(input.value.replace("£", "")) : input.value;

    unsavedChanges.push({
        id: recordId,
        fields: { [field]: value },
    });
}

// Publish changes to Airtable
async function publishChanges() {
    if (unsavedChanges.length === 0) {
        alert("No changes to publish.");
        return;
    }

    try {
        const responses = await Promise.all(
            unsavedChanges.map(change =>
                fetch(`${url}/${change.id}`, {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ fields: change.fields }),
                })
            )
        );

        if (responses.some(response => !response.ok)) {
            throw new Error("Some changes failed to publish.");
        }

        alert("All changes published successfully!");
        unsavedChanges = [];
    } catch (error) {
        console.error("Error publishing changes:", error);
    }
}

// Calculate winner
function calculateWinner() {
    let ellScore = 0;
    let jackScore = 0;

    document.querySelectorAll(".player").forEach((player) => {
        const score = parseFloat(player.querySelector("input[data-field='score']").value) || 0;

        if (player.parentElement.id.startsWith("ells")) {
            ellScore += score;
        }

        if (player.parentElement.id.startsWith("jacks")) {
            jackScore += score;
        }
    });

    document.getElementById("jacks-score").textContent = jackScore;
    document.getElementById("ells-score").textContent = ellScore;

    const winnerDisplay = document.getElementById("winner-display");
    winnerDisplay.textContent = ellScore > jackScore
        ? "Ell"
        : jackScore > ellScore
        ? "Jack"
        : "Draw";
}

// Load data on page load
document.addEventListener("DOMContentLoaded", fetchData);
