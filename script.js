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

        if (!response.ok) throw new Error(`Failed to fetch data: ${response.statusText}`);

        const data = await response.json();
        console.log("Fetched data:", data);
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
    // Clear existing data
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
        positionCircle.style.backgroundColor = bench ? "#cccccc" : "#ffffff";
        positionCircle.dataset.id = record.id;
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

    if (["value", "score"].includes(field)) {
        value = parseFloat(value);
        if (isNaN(value)) value = 0; // Default to 0 if invalid
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

// Toggle bench status
function toggleBenchStatus(event) {
    const circle = event.target;
    const recordId = circle.dataset.id;
    const currentBenchStatus = circle.dataset.bench === "true";
    const newBenchStatus = !currentBenchStatus;

    circle.style.backgroundColor = newBenchStatus ? "#cccccc" : "#ffffff";
    circle.dataset.bench = newBenchStatus;

    const existingChange = unsavedChanges.find((change) => change.id === recordId);
    if (existingChange) {
        existingChange.fields.bench = newBenchStatus;
    } else {
        unsavedChanges.push({
            id: recordId,
            fields: { bench: newBenchStatus },
        });
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
        console.log("Sending data to Airtable:", unsavedChanges);

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
        console.log("Changes saved to Airtable:", data);
        unsavedChanges = [];
    } catch (error) {
        console.error("Error saving changes to Airtable:", error);
    }
}

// Minimal test function
async function testAirtableWrite() {
    const testPayload = [
        {
            id: "rec1234567890", // Replace with a real Airtable record ID
            fields: {
                bench: true,
            },
        },
    ];

    try {
        console.log("Testing Airtable write with payload:", testPayload);
        const response = await fetch(url, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ records: testPayload }),
        });

        if (!response.ok) throw new Error(`Failed: ${response.statusText}`);
        const data = await response.json();
        console.log("Test successful. Airtable response:", data);
    } catch (error) {
        console.error("Test failed:", error);
    }
}

// Attach event listeners
document.addEventListener("DOMContentLoaded", fetchData);
document.getElementById("save-button").addEventListener("click", saveChanges);
