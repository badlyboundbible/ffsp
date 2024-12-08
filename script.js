// Example team data
const teams = {
  jack: [
    { name: "K. Schmeichel", team: "Cel", position: "GK", score: 6 },
    { name: "N. Devlin", team: "Abd", position: "DEF", score: 2 },
    { name: "V. Sevelj", team: "DDU", position: "DEF", score: 0 },
    { name: "N. Kuhn", team: "Cel", position: "FWD", score: 6 },
  ],
  ell: [
    { name: "S. Dalby", team: "DDU", position: "FWD", score: 1 },
    { name: "L. Cameron", team: "Dun", position: "MID", score: 2 },
    { name: "S. Murray", team: "Dun", position: "FWD", score: 1 },
    { name: "Z. Larkeche", team: "StJ", position: "DEF", score: 0 },
  ],
};

// Function to render players into tables
function renderTeam(teamId, teamData) {
  const teamContainer = document.getElementById(teamId);
  teamContainer.innerHTML = ""; // Clear existing rows

  teamData.forEach((player, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${player.name}</td>
      <td>
        <select>
          <option value="Cel" ${player.team === "Cel" ? "selected" : ""}>Cel</option>
          <option value="Abd" ${player.team === "Abd" ? "selected" : ""}>Abd</option>
          <option value="DDU" ${player.team === "DDU" ? "selected" : ""}>DDU</option>
          <option value="Dun" ${player.team === "Dun" ? "selected" : ""}>Dun</option>
        </select>
      </td>
      <td>${player.position}</td>
      <td><input type="number" value="${player.score}" data-team="${teamId}" data-index="${index}"></td>
    `;
    teamContainer.appendChild(row);
  });
}

// Function to calculate the winner
function calculateWinner() {
  const jackTotal = teams.jack.reduce((sum, player) => sum + player.score, 0);
  const ellTotal = teams.ell.reduce((sum, player) => sum + player.score, 0);

  const winnerText = jackTotal > ellTotal
    ? "Lord Frosty's XI Wins!"
    : ellTotal > jackTotal
    ? "Ell's Allstars Wins!"
    : "It's a tie!";
  document.getElementById("winner").textContent = winnerText;
}

// Update player scores when input changes
document.addEventListener("input", (event) => {
  if (event.target.type === "number") {
    const teamId = event.target.dataset.team;
    const playerIndex = event.target.dataset.index;
    const newScore = parseInt(event.target.value, 10);

    if (teamId && !isNaN(newScore)) {
      teams[teamId][playerIndex].score = newScore;
    }
  }
});

// Render both teams on page load
renderTeam("team-jack", teams.jack);
renderTeam("team-ell", teams.ell);

// Add event listener for calculating winner
document.getElementById("calculate-winner").addEventListener("click", calculateWinner);
