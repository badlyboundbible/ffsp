// Initialize Supabase client
const supabase = supabase.createClient(
    "https://cfmtrhlovulezzswxqsu.supabase.co", // Supabase URL
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmbXRyaGxvdnVsZXp6c3d4cXN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM2NDc1NjEsImV4cCI6MjA0OTIyMzU2MX0.J72n-YGyt1HkeYG4GGuKvZ9JeSZDz4rj1pI6bYPLEIU" // Supabase Public API Key
);

// Positions for each team
const positions = [
    { id: "gk", name: "Goalkeepers", count: 2 },
    { id: "def", name: "Defenders", count: 5 },
    { id: "mid", name: "Midfielders", count: 5 },
    { id: "fwd", name: "Forwards", count: 3 },
];

// Initialize the pitch layout
function setupPitch() {
    positions.forEach(pos => {
        const ellSection = document.getElementById(`ell-${pos.id}`);
        const jackSection = document.getElementById(`jack-${pos.id}`);

        for (let i = 0; i < pos.count; i++) {
            const ellPlayer = createPlayerInput(pos.name, `ell-${pos.id}-${i}`);
            ellSection.appendChild(ellPlayer);

            const jackPlayer = createPlayerInput(pos.name, `jack-${pos.id}-${i}`);
            jackSection.appendChild(jackPlayer);
        }
    });

    loadFromSupabase();
}

// Create player input fields
function createPlayerInput(position, id) {
    const div = document.createElement("div");
    div.className = "player";
    div.innerHTML = `
        <div>${position}</div>
        <input type="text" placeholder="Name" data-id="${id}-name">
        <input type="text" placeholder="Team" data-id="${id}-team">
        <input type="number" placeholder="Value (£)" step="0.1" data-id="${id}-value">
        <input type="number" placeholder="Score" value="0" data-id="${id}-score">
    `;

    const inputs = div.querySelectorAll("input");
    inputs.forEach(input => {
        input.addEventListener("input", () => {
            saveToSupabase(id);
        });
    });

    return div;
}

// Save player data to Supabase
async function saveToSupabase(playerId) {
    const name = document.querySelector(`input[data-id="${playerId}-name"]`).value;
    const team = document.querySelector(`input[data-id="${playerId}-team"]`).value;
    const value = document.querySelector(`input[data-id="${playerId}-value"]`).value;
    const score = document.querySelector(`input[data-id="${playerId}-score"]`).value;

    const { error } = await supabase.from("fantasy_football").upsert({
        player_id: playerId,
        name,
        team,
        value: parseFloat(value),
        score: parseFloat(score),
    });

    if (error) console.error("Error saving to Supabase:", error);
}

// Load player data from Supabase
async function loadFromSupabase() {
    const { data, error } = await supabase.from("fantasy_football").select("*");
    if (error) {
        console.error("Error loading from Supabase:", error);
        return;
    }

    data.forEach(player => {
        const nameInput = document.querySelector(`input[data-id="${player.player_id}-name"]`);
        const teamInput = document.querySelector(`input[data-id="${player.player_id}-team"]`);
        const valueInput = document.querySelector(`input[data-id="${player.player_id}-value"]`);
        const scoreInput = document.querySelector(`input[data-id="${player.player_id}-score"]`);

        if (nameInput) nameInput.value = player.name;
        if (teamInput) teamInput.value = player.team;
        if (valueInput) valueInput.value = player.value;
        if (scoreInput) scoreInput.value = player.score;
    });
}

// Calculate the winner
function calculateWinner() {
    let ellScore = 0;
    let jackScore = 0;

    document.querySelectorAll("[data-id$='-score']").forEach(input => {
        const value = parseFloat(input.value) || 0;
        if (input.dataset.id.startsWith("ell-")) {
            ellScore += value;
        } else if (input.dataset.id.startsWith("jack-")) {
            jackScore += value;
        }
    });

    const winnerDisplay = document.getElementById("winner-display");
    if (ellScore > jackScore) {
        winnerDisplay.innerText = "Winner: Ell's Allstars";
    } else if (jackScore > ellScore) {
        winnerDisplay.innerText = "Winner: Jack's Team";
    } else {
        winnerDisplay.innerText = "Winner: Draw";
    }
}

// Reset all scores
function resetScores() {
    document.querySelectorAll("input[data-id$='-score']").forEach(input => {
        input.value = 0;
        saveToSupabase(input.dataset.id.split("-")[0]);
    });

    document.getElementById("winner-display").innerText = "Winner: -";
}

// Initialize pitch on page load
document.addEventListener("DOMContentLoaded", setupPitch);
