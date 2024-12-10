// ... Previous JavaScript (Unchanged)

async function fetchData() {
    const loader = document.getElementById('loader');
    loader.style.display = 'block'; // Show loader
    console.log("Fetching data from Airtable...");
    try {
        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${apiKey}` }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.statusText} (HTTP ${response.status})`);
        }

        const data = await response.json();
        console.log("Data fetched from Airtable:", data);

        if (data.records) {
            displayPlayers(data.records);
        } else {
            console.error("No records found in Airtable.");
            alert("No player data found! Check Airtable configuration.");
        }
    } catch (error) {
        console.error("Error fetching data from Airtable:", error);
        alert("Error fetching player data. Please try again later.");
    } finally {
        loader.style.display = 'none'; // Hide loader
    }
}

async function handleInputChange(event) {
    const input = event.target;
    const recordId = input.dataset.id; // Airtable record ID
    const field = input.dataset.field; // Field to update
    const value = input.value; // New value

    const payload = {
        fields: {
            [field]: isNaN(value) ? value : parseFloat(value) // Convert numbers to float
        }
    };

    try {
        const response = await fetch(`${url}/${recordId}`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Failed to update Airtable: ${response.statusText} (HTTP ${response.status})`);
        }

        alert("Data saved successfully!"); // User feedback
    } catch (error) {
        console.error(`Error updating ${field} for record ${recordId}:`, error);
        alert("Failed to save data. Please try again.");
    }
}

function calculateWinner() {
    let ellScore = 0;
    let jackScore = 0;

    document.querySelectorAll(".player").forEach(player => {
        const score = parseFloat(player.querySelector("input[data-field='score']").value) || 0;
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

    alert("Winner calculated!"); // User feedback
}
