document.getElementById("publish").addEventListener("click", () => {
  const jackScores = [...document.querySelectorAll(".jack .player-card input:last-of-type")].map(input => Number(input.value) || 0);
  const ellScores = [...document.querySelectorAll(".ell .player-card input:last-of-type")].map(input => Number(input.value) || 0);

  const jackTotal = jackScores.reduce((a, b) => a + b, 0);
  const ellTotal = ellScores.reduce((a, b) => a + b, 0);

  document.getElementById("jack-score").textContent = jackTotal;
  document.getElementById("ell-score").textContent = ellTotal;

  const winner = jackTotal > ellTotal ? "Jack" : ellTotal > jackTotal ? "Ell" : "Draw";
  document.getElementById("winner").textContent = `Winner: ${winner}`;

  const table = document.querySelector(".score-table tbody");
  const newRow = document.createElement("tr");
  newRow.innerHTML = `
    <td>Week ${table.children.length + 1}</td>
    <td>${jackTotal}</td>
    <td>${winner}</td>
    <td>${ellTotal}</td>
  `;
  table.appendChild(newRow);
});
