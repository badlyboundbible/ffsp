// Airtable configuration
const apiKey = "YOUR_AIRTABLE_API_KEY";
const baseId = "YOUR_AIRTABLE_BASE_ID";
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

// Local state for bench status
const localState = {};

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
        displayPlayers(data.records);
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
        const { player_id, name = "Unknown", team = "N/A", bench = false } = fields;
        const teamPrefix = player_id.startsWith("ell") ? "ells" : "jacks";
        const positionType = player_id.split("-")[1];

        // Save the initial bench status in local state
        localState[record.id] = { bench };

        const playerDiv = document.createElement("div");
        playerDiv.className = "player";

        const positionCircle = document.createElement("div");
        positionCircle.className = "position-circle";
        positionCircle.textContent = positionType.toUpperCase();
        positionCircle.style.backgroundColor = bench ? teamColors[team] : "#cccccc";
        positionCircle.dataset.id = record.id;
        positionCircle.dataset.team = team;
        positionCircle.addEventListener("click", () => toggleBenchStatus(positionCircle));
        playerDiv.appendChild(positionCircle);

        const nameInput = document.createElement("input");
        nameInput.value = name;
        nameInput.readOnly = true; // Name field is non-editable
        playerDiv.appendChild(nameInput);

        const container = document.getElementById(`${teamPrefix}-${positionType}`);
        if (container) container.appendChild(playerDiv);
    });
}

// Toggle bench status locally
function toggleBenchStatus(circle) {
    const recordId = circle.dataset.id;
    const currentBench = localState[recordId].bench;
    const newBench = !currentBench;

    // Update local state
    localState[recordId].bench = newBench;

    // Update the circle color
    circle.style.backgroundColor = newBench ? teamColors[circle.dataset.team] : "#cccccc";
}

// Save changes to Airtable
async function saveChanges() {
    const updates = Object.keys(localState).map((id) => ({
        id,
        fields: { bench: localState[id].bench },
    }));

    try {
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

        alert("Changes saved successfully!");
    } catch (error) {
        console.error("Error saving changes:", error);
        alert("Failed to save changes.");
    }
}

// Add event listener to the "Save Changes" button
document.getElementById("save-changes-button").addEventListener("click", saveChanges);

// Load data on page load
document.addEventListener("DOMContentLoaded", fetchData);
