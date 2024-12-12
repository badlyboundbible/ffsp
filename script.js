// Airtable configuration
const apiKey = "patIQZcsLZw1aCILS.3d2edb2f1380092318363d8ffd99f1a695ff6db84c300d36e2be82288d4b3489";
const baseId = "appoF7fRSS4nuF9u2";
const tableName = "Table 1";
const url = `https://api.airtable.com/v0/${baseId}/${tableName}`;

let unsavedChanges = []; // To track unsaved changes

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
    try {
        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${apiKey}` },
        });

        if (!response.ok) throw new Error(`Failed to fetch data: ${response.statusText}`);

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
        const { player_id, name = "", team = "N/A", value = "0.0", score = "0", bench = false } = fields;
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
        positionCircle.dataset.team = team;
        positionCircle.dataset.bench = bench;
        positionCircle.addEventListener("click", toggleBenchStatus);
        playerDiv.appendChild(positionCircle);

        const nameInput = document.createElement("input");
        nameInput.value = name;
        nameInput.placeholder = "Name";
        nameInput.dataset.id = record.id;
        nameInput.dataset.field = "name";
        nameInput.addEventListener("input", trackChange);
        playerDiv.appendChild(nameInput);

        const teamSelect = document.createElement("select");
        teamSelect.dataset.id = record.id;
        teamSelect.dataset.field = "team";
        ["ABD", "CEL", "HEA", "HIB", "KIL", "MOT", "RAN", "SMN", "SJN", "DUN", "DDU", "ROS"].forEach((teamOption) => {
            const option = document.createElement("option");
            option.value = teamOption;
            option.textContent = teamOption;
            if (teamOption === team) option.selected = true;
            teamSelect.appendChild(option);
        });
        teamSelect.addEventListener("change", (event) => {
            trackChange(event);
            updateCircleColor(teamSelect, positionCircle);
        });
        playerDiv.appendChild(teamSelect);

        const valueInput = document.createElement("input");
        valueInput.value = value;
        valueInput.placeholder = "Value (£)";
        valueInput.dataset.id = record.id;
        valueInput.dataset.field = "value";
        valueInput.addEventListener("input", trackChange);
        playerDiv.appendChild(valueInput);

        const scoreInput = document.createElement("input");
        scoreInput.value = score;
        scoreInput.placeholder = "Score";
        scoreInput.dataset.id = record.id;
        scoreInput.dataset.field = "score";
        scoreInput.addEventListener("input", trackChange);
        playerDiv.appendChild(scoreInput);

        const container = document.getElementById(`${teamPrefix}-${positionType}`);
        if (container) container.appendChild(playerDiv);
    });
}

// Track changes to fields
function trackChange(event) {
    const input = event.target;
    const recordId = input.dataset.id;
    const field = input.dataset.field;
    let value = input.value;

    // Convert to number if the field is numerical
    if (["value", "score"].includes(field)) {
        value = parseFloat(value);
        if (isNaN(value)) value = 0; // Default to 0 if the input is not a valid number
    }

    const existingChange = unsavedChanges.find((change) => change.id === recordId);
    if (existingChange) {
        existingChange.fields[field] = value;
    } else {
        unsavedChanges.push({
            id: recordId,
            fields: { [field]: value },
        });
    }
    console.log("Unsaved changes:", unsavedChanges);
}

// Toggle bench status and track changes
function toggleBenchStatus(event) {
    const circle = event.target;
    const recordId = circle.dataset.id;
    const currentBenchStatus = circle.dataset.bench === "true";
    const newBenchStatus = !currentBenchStatus;

    // Update the circle's visual appearance
    circle.style.backgroundColor = newBenchStatus ? "#cccccc" : (teamColors[circle.dataset.team] || "#cccccc");
    circle.dataset.bench = newBenchStatus.toString();

    // Track the bench status change
    const existingChange = unsavedChanges.find((change) => change.id === recordId);
    if (existingChange) {
        existingChange.fields["bench"] = newBenchStatus;
    } else {
        unsavedChanges.push({
            id: recordId,
            fields: { bench: newBenchStatus },
        });
    }
    console.log("Unsaved changes:", unsavedChanges);
}

// Update circle color based on the selected team
function updateCircleColor(teamSelect, positionCircle) {
    const selectedTeam = teamSelect.value;
    const isBench = positionCircle.dataset.bench === "true";
    positionCircle.style.backgroundColor = isBench ? "#cccccc" : (teamColors[selectedTeam] || "#cccccc");
}

// Save all changes to Airtable
async function saveChanges() {
    if (unsavedChanges.length === 0) {
        console.log("No changes to save.");
        return;
    }

    try {
        const updates = unsavedChanges.map((change) => ({
            id: change.id,
            fields: change.fields,
        }));

        console.log("Sending data to Airtable:", updates);
        const response = await fetch(url, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ records: updates }),
        });

        if (!response.ok) throw new Error(`Failed to save changes: ${response.statusText}`);

        const data = await response.json();
        console.log("Changes saved successfully:", data);
        unsavedChanges = [];
    } catch (error) {
        console.error("Error saving changes:", error);
    }
}

// Event listeners
document.addEventListener("DOMContentLoaded", fetchData);
document.getElementById("save-button").addEventListener("click", saveChanges);
