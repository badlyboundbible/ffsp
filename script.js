// Include Supabase Library
const supabase = supabase.createClient(
    "https://cfmtrhlovulezzswxqsu.supabase.co", // Your Supabase URL
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmbXRyaGxvdnVsZXp6c3d4cXN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM2NDc1NjEsImV4cCI6MjA0OTIyMzU2MX0.J72n-YGyt1HkeYG4GGuKvZ9JeSZDz4rj1pI6bYPLEIU" // Your Public API Key
);

// Load data from Supabase and populate UI
async function loadFromSupabase() {
    const { data, error } = await supabase.from("fantasy_football").select("*");
    if (error) console.error("Error loading data:", error);

    // Populate inputs with saved data
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

// Save player data to Supabase
async function savePlayerData(playerId, name, team, value, score) {
    const { error } = await supabase.from("fantasy_football").upsert({
        player_id: playerId,
        name: name,
        team: team,
        value: parseFloat(value),
        score: parseFloat(score),
    });

    if (error) console.error("Error saving data:", error);
}

// Set up event listeners to save data
function setupEventListeners() {
    const inputs = document.querySelectorAll("input");
    inputs.forEach(input => {
        input.addEventListener("input", () => {
            const playerId = input.dataset.id.split("-")[0];
            const type = input.dataset.id.split("-")[1];
            const rowInputs = document.querySelectorAll(`[data-id^="${playerId}"]`);

            const name = rowInputs[0].value;
            const team = rowInputs[1].value;
            const value = rowInputs[2].value;
            const score = rowInputs[3].value;

            savePlayerData(playerId, name, team, value, score);
        });
    });
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

    return div;
}

// Initialize the app
document.addEventListener("DOMContentLoaded", () => {
    setupPitch();
    loadFromSupabase();
    setupEventListeners();
});
