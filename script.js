// Calculate the winner and update individual scores
function calculateWinner() {
    let ellScore = 0;
    let jackScore = 0;

    // Iterate through all players and calculate scores
    document.querySelectorAll(".player").forEach(player => {
        const score = parseFloat(player.querySelector("input[data-field='score']").value) || 0;
        if (player.parentElement.id.startsWith("ells")) {
            ellScore += score;
        } else if (player.parentElement.id.startsWith("jacks")) {
            jackScore += score;
        }
    });

    // Update scores in the Final Score section
    document.getElementById("jacks-score").textContent = `Jack's Score: ${jackScore}`;
    document.getElementById("ells-score").textContent = `Ell's Score: ${ellScore}`;

    // Determine and display the winner
    const winnerDisplay = document.getElementById("winner-display");
    if (ellScore > jackScore) {
        winnerDisplay.textContent = "Winner: Ell's Allstars";
    } else if (jackScore > ellScore) {
        winnerDisplay.textContent = "Winner: Jack's Team";
    } else {
        winnerDisplay.textContent = "Winner: Draw";
    }
}

// Load data on page load
document.addEventListener("DOMContentLoaded", fetchData);
