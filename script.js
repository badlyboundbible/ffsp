const positions = [
    { id: "gk", name: "Goalkeepers", count: 2 },
    { id: "def", name: "Defenders", count: 5 },
    { id: "mid", name: "Midfielders", count: 5 },
    { id: "fwd", name: "Forwards", count: 3 },
];

// Set up teams on the football pitch
function setupPitch() {
    positions.forEach(pos => {
        const ellSection = document.getElementById(`ell-${pos.id}`);
        const jackSection = document.getElementById(`jack-${pos.id}`);
        
        for (let i = 0; i < pos.count; i++) {
            // Ell's Players
            const ellPlayer = createPlayerInput(pos.name);
            ellSection.appendChild(ellPlayer);

            // Jack's Players
            const jackPlayer = createPlayerInput(pos.name);
            jackSection.appendChild(jackPlayer);
        }
    });
}

// Create a player input card
function createPlayerInput(position) {
    const div = document.createElement("div");
    div.className = "player";
    div.innerHTML = `
        <div>${position}</div>
        <input type="text" placeholder="Name">
        <input type="text" placeholder="Team">
        <input type="number" placeholder="Value (£)" step="0.1">
        <input type="number" placeholder="Score" value="0">
    `;
    return div;
}

// Calculate winner based on scores
function calculateWinner() {
    const ellPlayers = document.querySelectorAll("#ell-gk input:last-child, #ell-def input:last-child, #ell-mid input:last-child, #ell-fwd input:last-child");
    const jackPlayers = document.querySelectorAll("#jack-gk input:last-child, #jack-def input:last-child, #jack-mid input:last-child, #jack-fwd input:last-child");
    
    let ellScore = 0, jackScore = 0;

    ellPlayers.forEach(input => {
        ellScore += parseFloat(input.value) || 0;
    });

    jackPlayers.forEach(input => {
        jackScore += parseFloat(input.value) || 0;
    });

    let winner = "Draw";
    if (ellScore > jackScore) winner = "Ell's Allstars";
    else if (jackScore > ellScore) winner = "Jack's Team";

    document.getElementById("winner-display").innerText = `Winner: ${winner}`;
}

// Reset scores for next week
function resetScores() {
    document.querySelectorAll("input[type='number']").forEach(input => {
        input.value = 0;
    });
    document.getElementById("winner-display").innerText = "Winner: -";
}

// Initialize the pitch layout
document.addEventListener("DOMContentLoaded", setupPitch);
