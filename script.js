// Airtable configuration
const apiKey = "patIQZcsLZw1aCILS.3d2edb2f1380092318363d8ffd99f1a695ff6db84c300d36e2be82288d4b3489";
const baseId = "appoF7fRSS4nuF9u2";
const tableName = "Table 1";
const url = `https://api.airtable.com/v0/${baseId}/${tableName}`;

let unsavedChanges = []; // To track unsaved changes

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
        positionCircle.style.backgroundColor = bench ? "#cccccc" : (teamColors[team] || "#cccccc");
        positionCircle.dataset.id = record.id;
        positionCircle.dataset.bench = bench;
        positionCircle.dataset.team = team;
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
        teamSelect.addEventListener("change", handleInputChange);
        playerDiv.appendChild(teamSelect);

        const valueInput = document.createElement("input");
        valueInput.value = value;
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

// Store unsaved changes
function handleInputChange(event) {
    const input = event.target;
    const recordId = input.dataset.id;
    const field = input.dataset.field;
    const value = input.value;

    console.log(`Storing change for ${field} on record ${recordId}: ${value}`);

    const existingChange = unsavedChanges.find(change => change.id === recordId);
    if (existingChange) {
        existingChange.fields[field] = isNaN(value) ? value : parseFloat(value);
    } else {
        unsavedChanges.push({
            id: recordId,
            fields: {
                [field]: isNaN(value) ? value : parseFloat(value),
            },
        });
    }
}

// Save all changes
async function saveChanges() {
    console.log("Saving changes to Airtable...");
    try {
        const updates = unsavedChanges.map(change => ({
            id: change.id,
            fields: change.fields,
        }));

        const response = await fetch(url, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ records: updates }),
        });

        if (!response.ok) {
            throw new Error(`Failed to save changes: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Changes saved:", data);
        unsavedChanges = [];
    } catch (error) {
        console.error("Error saving changes:", error);
    }
}

// Calculate the winner
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

document.addEventListener("DOMContentLoaded", fetchData);
document.getElementById("save-button").addEventListener("click", saveChanges);
