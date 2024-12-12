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
        displayPlayers(data.records);
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

// Display players on the pitch
function displayPlayers(records) {
    const positions = ["ells", "jacks"].flatMap(team =>
        ["gk", "def", "mid", "fwd"].map(position => `${team}-${position}`)
    );

    // Clear existing content
    positions.forEach(position => {
        document.getElementById(position).innerHTML = "";
    });

    records.forEach((record) => {
        const { fields } = record;
        const { player_id, name = "", team = "N/A", value = "0.0", score = "0", bench = false } = fields;

        const teamPrefix = player_id.startsWith("ell") ? "ells" : "jacks";
        const positionType = player_id.split("-")[1];
        const container = document.getElementById(`${teamPrefix}-${positionType}`);
        if (!container) return;

        const playerDiv = document.createElement("div");
        playerDiv.className = "player";

        // Circle
        const positionCircle = document.createElement("div");
        positionCircle.className = "position-circle";
        positionCircle.textContent = positionType.toUpperCase();
        positionCircle.style.backgroundColor = bench ? "#cccccc" : (teamColors[team] || "#ffffff");
        positionCircle.dataset.id = record.id;
        positionCircle.dataset.bench = bench;
        positionCircle.addEventListener("click", toggleBenchStatus);
        playerDiv.appendChild(positionCircle);

        // Name Input
        const nameInput = document.createElement("input");
        nameInput.value = name;
        nameInput.dataset.id = record.id;
        nameInput.dataset.field = "name";
        nameInput.addEventListener("input", trackChange);
        playerDiv.appendChild(nameInput);

        // Append to container
        container.appendChild(playerDiv);
    });
}

// Track changes to player data
function trackChange(event) {
    const input = event.target;
    const recordId = input.dataset.id;
    const field = input.dataset.field;
    const value = input.value;

    const change = unsavedChanges.find(change => change.id === recordId);
    if (change) {
        change.fields[field] = value;
    } else {
        unsavedChanges.push({ id: recordId, fields: { [field]: value } });
    }
    console.log("Unsaved changes:", unsavedChanges);
}

// Toggle bench status
function toggleBenchStatus(event) {
    const circle = event.target;
    const recordId = circle.dataset.id;
    const currentBench = circle.dataset.bench === "true";
    const newBench = !currentBench;

    circle.dataset.bench = newBench;
    circle.style.backgroundColor = newBench ? "#cccccc" : (teamColors[circle.dataset.team] || "#ffffff");

    const change = unsavedChanges.find(change => change.id === recordId);
    if (change) {
        change.fields.bench = newBench;
    } else {
        unsavedChanges.push({ id: recordId, fields: { bench: newBench } });
    }
    console.log("Bench toggled. Unsaved changes:", unsavedChanges);
}

// Save changes to Airtable
async function saveChanges() {
    if (unsavedChanges.length === 0) {
        console.log("No changes to save.");
        return;
    }

    try {
        console.log("Saving changes:", unsavedChanges);
        const response = await fetch(url, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ records: unsavedChanges }),
        });

        if (!response.ok) throw new Error(`Failed to save changes: ${response.statusText}`);

        const data = await response.json();
        console.log("Changes saved successfully:", data);
        unsavedChanges = []; // Clear changes
    } catch (error) {
        console.error("Error saving changes:", error);
    }
}

// Load data on page load
document.addEventListener("DOMContentLoaded", fetchData);
document.getElementById("save-button").addEventListener("click", saveChanges);
