let weekCounter = 1;

// Example player list for each team
const positions = [
    { position: "GK", count: 2 },
    { position: "DEF", count: 5 },
    { position: "MID", count: 5 },
    { position: "FWD", count: 3 },
];

function setupTeams() {
    const ellTeam = document.querySelector("#ell-team tbody");
    const jackTeam = document.querySelector("#jack-team tbody");

    // Generate rows for Ell's and Jack's teams
    positions.forEach(pos => {
        for (let i = 0; i < pos.count; i++) {
            const ellRow = document.createElement("tr");
            ellRow.innerHTML = `<td>${pos.position}</td><td><input type="text" placeholder="Player Name"></td><td><input type="number" value="0"></td>`;
            ellTeam.appendChild(ellRow);

            const jackRow = document.createElement("tr");
            jackRow.innerHTML = `<td>${pos.position}</td><td><input type="text" placeholder="Player Name"></td><td><input type="number" value="0"></td>`;
            jackTeam.appendChild(jackRow);
        }
    });

    loadHistory();
}

function calculateWinner() {
    const ellTeam = document.querySelectorAll("#ell-team tbody tr");
    const jackTeam = document.querySelectorAll("#jack-team tbody tr");

    let ellTotal = 0;
    let jackTotal = 0;

    ellTeam.forEach(row => {
        const score = parseFloat(row.querySelector("td:nth-child(3) input").value) || 0;
        ellTotal += score;
    });

    jackTeam.forEach(row => {
        const score = parseFloat(row.querySelector("td:nth-child(3) input").value) || 0;
        jackTotal += score;
    });

    let winner = "Draw";
    if (ellTotal > jackTotal) {
        winner = "Ell's Allstars";
    } else if (jackTotal > ellTotal) {
        winner = "Jack's Team";
    }

    document.getElementById("winner-display").innerText = `Winner: ${winner}`;
    saveToHistory(ellTotal, jackTotal, winner);
}

function saveToHistory(ellScore, jackScore, winner) {
    const historyTable = document.querySelector("#history-table tbody");

    const newRow = document.createElement("tr");
    newRow.innerHTML = `<td>Week ${weekCounter}</td><td>${ellScore}</td><td>${jackScore}</td><td>${winner}</td>`;
    historyTable.appendChild(newRow);

    saveToLocalStorage(ellScore, jackScore, winner);
    weekCounter++;
}

function saveToLocalStorage(ellScore, jackScore, winner) {
    const history = JSON.parse(localStorage.getItem("fantasyHistory")) || [];
    history.push({ week: weekCounter, ellScore, jackScore, winner });
    localStorage.setItem("fantasyHistory", JSON.stringify(history));
}

function loadHistory() {
    const history = JSON.parse(localStorage.getItem("fantasyHistory")) || [];
    const historyTable = document.querySelector("#history-table tbody");

    history.forEach(entry => {
        const newRow = document.createElement("tr");
        newRow.innerHTML = `<td>Week ${entry.week}</td><td>${entry.ellScore}</td><td>${entry.jackScore}</td><td>${entry.winner}</td>`;
        historyTable.appendChild(newRow);
        weekCounter = entry.week + 1;
    });
}

function resetScores() {
    document.querySelectorAll("input[type='number']").forEach(input => {
        input.value = 0;
    });

    document.getElementById("winner-display").innerText = "Winner: -";
}

document.addEventListener("DOMContentLoaded", setupTeams);
