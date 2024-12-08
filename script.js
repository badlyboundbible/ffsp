let weekCounter = 1;

function calculateScores() {
    const ellTeam = document.querySelectorAll('#ell-team tbody tr');
    const jackTeam = document.querySelectorAll('#jack-team tbody tr');
    
    let ellTotal = 0;
    let jackTotal = 0;

    ellTeam.forEach(row => {
        const score = parseFloat(row.querySelector('td:nth-child(4) input').value) || 0;
        ellTotal += score;
    });

    jackTeam.forEach(row => {
        const score = parseFloat(row.querySelector('td:nth-child(4) input').value) || 0;
        jackTotal += score;
    });

    alert(`Ell's Total: ${ellTotal}\nJack's Total: ${jackTotal}`);
}

function saveToHistory() {
    const ellTeam = document.querySelectorAll('#ell-team tbody tr');
    const jackTeam = document.querySelectorAll('#jack-team tbody tr');
    
    let ellTotal = 0;
    let jackTotal = 0;

    ellTeam.forEach(row => {
        const score = parseFloat(row.querySelector('td:nth-child(4) input').value) || 0;
        ellTotal += score;
    });

    jackTeam.forEach(row => {
        const score = parseFloat(row.querySelector('td:nth-child(4) input').value) || 0;
        jackTotal += score;
    });

    const historyTable = document.querySelector('#history-table tbody');
    const newRow = document.createElement('tr');
    newRow.innerHTML = `<td>Week ${weekCounter}</td><td>${ellTotal}</td><td>${jackTotal}</td>`;
    historyTable.appendChild(newRow);

    weekCounter++;
}

function resetScores() {
    const ellTeam = document.querySelectorAll('#ell-team tbody tr');
    const jackTeam = document.querySelectorAll('#jack-team tbody tr');
    
    ellTeam.forEach(row => {
        row.querySelector('td:nth-child(4) input').value = 0;
    });

    jackTeam.forEach(row => {
        row.querySelector('td:nth-child(4) input').value = 0;
    });

    alert('Scores have been reset for next week!');
}
