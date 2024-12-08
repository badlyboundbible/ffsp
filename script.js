document.querySelector("#publish").addEventListener("click", function () {
  const jackScores = [...document.querySelectorAll(".jack input[type='number']")].map(
    (input) => parseInt(input.value) || 0
  );
  const ellScores = [...document.querySelectorAll(".ell input[type='number']")].map(
    (input) => parseInt(input.value) || 0
  );

  const jackTotal = jackScores.reduce((a, b) => a + b, 0);
  const ellTotal = ellScores.reduce((a, b) => a + b, 0);

  document.getElementById("jack-score").textContent = jackTotal;
  document.getElementById("ell-score").textContent = ellTotal;

  let winner = "Draw";
  if (jackTotal > ellTotal) {
    winner = "Jack";
  } else if (ellTotal > jackTotal) {
    winner = "Ell";
  }

  document.getElementById("winner").textContent = `Winner: ${winner}`;

  const resultsTable = document.querySelector(".score-table tbody");
  const newRow = document.createElement("tr");
  newRow.innerHTML = `
    <td>Week ${resultsTable.children.length + 1}</td>
    <td>${jackTotal}</td>
    <td>${winner}</td>
    <td>${ellTotal}</td>
  `;
  resultsTable.appendChild(newRow);
});
