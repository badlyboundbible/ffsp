function displayPlayers(records) {
    console.log("Displaying players...");
    // Clear all existing players
    ["ells", "jacks"].forEach(team => {
        ["gk", "def", "mid", "fwd"].forEach(position => {
            document.getElementById(`${team}-${position}`).innerHTML = "";
        });
    });

    // Process and display each record
    records.forEach(record => {
        const fields = record.fields;

        if (!fields || !fields.player_id) {
            console.warn("Skipping record due to missing player_id:", record);
            return;
        }

        const { id } = record;
        const { player_id, name = "Unknown", team = "N/A", value = "0.0", score = "0" } = fields;

        const isEll = player_id.startsWith("ell");
        const teamPrefix = isEll ? "ells" : "jacks";
        const positionType = player_id.split("-")[1];
        const positionAbbreviation = getPositionAbbreviation(player_id);

        const playerDiv = document.createElement("div");
        playerDiv.className = "player";

        const teamOptions = Object.keys(teamColors)
            .map(
                teamKey =>
                    `<option value="${teamKey}" ${teamKey === team ? "selected" : ""}>${teamKey}</option>`
            )
            .join("");

        // Get the exact color for the team, or use a default
        const teamColor = teamColors[team] || "#cccccc";

        // Render player card
        playerDiv.innerHTML = `
            <div class="position-circle" style="background-color: ${teamColor};">
                ${positionAbbreviation}
            </div>
            <input data-id="${id}" data-field="name" value="${name}" placeholder="Name" />
            <select data-id="${id}" data-field="team">${teamOptions}</select>
            <input data-id="${id}" data-field="value" value="${value}" placeholder="Value (£)" />
            <input data-id="${id}" data-field="score" value="${score}" placeholder="Score" />
        `;

        // Attach event listeners for inputs and dropdowns
        playerDiv.querySelectorAll("input").forEach(input => {
            input.addEventListener("blur", handleInputChange); // Trigger update on blur
        });

        playerDiv.querySelectorAll("select").forEach(select => {
            select.addEventListener("change", handleInputChange); // Trigger update on change
        });

        // Append to appropriate team and position container
        const positionContainer = document.getElementById(`${teamPrefix}-${positionType}`);
        if (positionContainer) {
            positionContainer.appendChild(playerDiv);
        } else {
            console.warn(`Invalid position: ${positionType} for player ${player_id}`);
        }
    });
}
