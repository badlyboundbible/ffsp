// Example team data (can replace this with a JSON file or API)
const teams = {
  jack: [
    { name: "K. Schmeichel", position: "GK", team: "Cel", score: 6 },
    { name: "N. Devlin", position: "DEF", team: "Abd", score: 2 },
    // Add more players here
  ],
  ell: [
    { name: "N. Kuhn", position: "FWD", team: "Cel", score: 6 },
    { name: "S. Dalby", position: "FWD", team: "DDU", score: 1 },
    // Add more players here
  ],
};

// Function to render teams
function renderTeam(teamId, teamData) {
  const teamContainer = document.getElementById(teamId);
  teamData.forEach((player) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${player.name}</td>
      <td>${player.position}</td>
      <td>${player.team}</td>
      <td><input type="number" value="${player.score}" class="score-input"></td>
    `;
    teamContainer.appendChild(row);
  });
}

// Render teams on page load
renderTeam("team-jack", teams.jack);
renderTeam("team-ell", teams.ell);

// Update scores dynamically (optional feature)
document.querySelectorAll(".score-input").forEach((input) => {
  input.addEventListener("change", (event) => {
    const newScore = event.target.value;
    console.log("Updated Score:", newScore);
  });
});
