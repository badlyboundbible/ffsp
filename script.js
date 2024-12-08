document.getElementById("publish").addEventListener("click", function () {
  const jackScores = [...document.querySelectorAll(".jack .player input:nth-child(3)")]
    .map(input => parseInt(input.value) || 0);
  const ellScores = [...document.querySelectorAll(".ell .player input:nth-child(3)")]
    .map(input => parseInt(input.value) || 0);

  const jackTotal = jackScores.reduce((a, b) => a + b, 0);
  const ellTotal = ellScores.reduce((a, b) => a + b, 0);

  document.getElementById("jack-score").textContent = jackTotal;
  document.getElementById("ell-score").textContent = ellTotal;

  let winner = "Draw";
  if (jackTotal > ellTotal) winner = "Jack";
  else if (ellTotal > jackTotal) winner = "Ell";

  document.getElementById("winner").textContent = winner;

  // Add row to the table
  const table = document.querySelector("#results tbody");
  const newRow = document.createElement("tr");
  newRow.innerHTML = `
    <td>Week ${table.rows.length + 1}</td>
    <td>${jackTotal}</td>
    <td>${winner}</td>
    <td>${ellTotal}</td>
  `;
  table.appendChild(newRow);
});
