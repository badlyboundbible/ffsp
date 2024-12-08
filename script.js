// Your Airtable configuration
const apiKey = "patIQZcsLZw1aCILS.3d2edb2f1380092318363d8ffd99f1a695ff6db84c300d36e2be82288d4b3489";
const baseId = "appoF7fRSS4nuF9u2";
const tableName = "Table 1"; // Change if your table has a different name

// Airtable API URL
const url = `https://api.airtable.com/v0/${baseId}/${tableName}`;

// Fetch data from Airtable
async function fetchData() {
    try {
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${apiKey}`
            }
        });
        const data = await response.json();

        // Display data or log errors
        if (data.records) {
            displayData(data.records);
        } else {
            console.error("Error fetching Airtable data:", data.error);
        }
    } catch (error) {
        console.error("Network error:", error);
    }
}

// Display data in the DOM
function displayData(records) {
    const container = document.getElementById("data-container");
    container.innerHTML = ""; // Clear existing content

    records.forEach(record => {
        const fields = record.fields;
        const div = document.createElement("div");
        div.className = "player";
        div.innerHTML = `
            <h3>${fields.name}</h3>
            <p>Team: ${fields.team}</p>
            <p>Value: £${fields.value}</p>
            <p>Score: ${fields.score}</p>
        `;
        container.appendChild(div);
    });
}

// Fetch data on page load
document.addEventListener("DOMContentLoaded", fetchData);
