// Constants and Utility Functions
const TEAM_COLORS = {
    ABD: "#e2001a",
    CEL: "#16973b",
    DUN: "#4f76ba",
    DDU: "#FF6601",
    HEA: "#800910",
    HIB: "#005000",
    KIL: "#534aeb",
    MOT: "#ffbe00",
    RAN: "#0000ff",
    ROS: "#040957",
    SJN: "#243f90",
    SMN: "#000000"
};

const PLAYER_ROLES = {
    NONE: 'none',
    CAPTAIN: 'captain',
    VICE_CAPTAIN: 'vice_captain',
    TRIPLE_CAPTAIN: 'triple_captain'
};

const ROLE_MULTIPLIERS = {
    [PLAYER_ROLES.NONE]: 1,
    [PLAYER_ROLES.CAPTAIN]: 2,
    [PLAYER_ROLES.VICE_CAPTAIN]: 1.5,
    [PLAYER_ROLES.TRIPLE_CAPTAIN]: 3
};

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// State Management Class
class FantasyState {
    constructor() {
        this.unsavedChanges = [];
        this.records = [];
    }

    addChange(change) {
        this.unsavedChanges.push(change);
    }

    clearChanges() {
        this.unsavedChanges = [];
    }

    setRecords(records) {
        this.records = records;
    }
}

// Airtable Service Class
class AirtableService {
    constructor() {
        this.apiKey = "patIQZcsLZw1aCILS.3d2edb2f1380092318363d8ffd99f1a695ff6db84c300d36e2be82288d4b3489";
        this.baseId = "appoF7fRSS4nuF9u2";
        this.tableName = "Table%201";
        this.url = `https://api.airtable.com/v0/${this.baseId}/${this.tableName}`;
        this.requestQueue = Promise.resolve();
    }

    async queueRequest(fn) {
        this.requestQueue = this.requestQueue
            .then(() => delay(200))
            .then(fn)
            .catch(error => {
                if (error.message.includes('RATE_LIMIT_REACHED')) {
                    return delay(1000).then(fn);
                }
                throw error;
            });
        return this.requestQueue;
    }

    async fetchData() {
        return this.queueRequest(async () => {
            try {
                const response = await fetch(this.url, {
                    headers: { 
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`Failed to fetch: ${response.statusText}`);
                }
                
                const data = await response.json();
                return data.records;
            } catch (error) {
                console.error("Fetch error:", error);
                throw error;
            }
        });
    }

    async publishChange(change) {
        return this.queueRequest(async () => {
            try {
                const sanitizedFields = {};
                Object.keys(change.fields).forEach(key => {
                    let value = change.fields[key];
                    if (key === "score" || key === "value" || key === "PEN") {
                        value = value === '' ? '' : parseFloat(value);
                    }
                    sanitizedFields[key] = value;
                });

                const response = await fetch(`${this.url}/${change.id}`, {
                    method: "PATCH",
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ fields: sanitizedFields })
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Update failed for ${change.id}: ${errorText}`);
                }
                
                return await response.json();
            } catch (error) {
                console.error(`Error updating ${change.id}:`, error);
                throw error;
            }
        });
    }
}

// FantasyFootballApp Class
class FantasyFootballApp {
    constructor() {
        this.state = new FantasyState();
        this.api = new AirtableService();
        this.init();
    }

    async init() {
        document.addEventListener("DOMContentLoaded", () => this.loadData());
    }

    async loadData() {
        try {
            const records = await this.api.fetchData();
            this.state.setRecords(records);
            this.displayPlayers(records);
            this.initializePowerups();
            this.initializePenaltyDropdowns();
        } catch (error) {
            console.error("Failed to load data:", error);
        }
    }

    displayPlayers(records) {
        ["ells", "jacks"].forEach(team => {
            ["gk", "def", "mid", "fwd"].forEach(position => {
                document.getElementById(`${team}-${position}`).innerHTML = "";
            });
        });

        records.forEach(record => {
            if (!record.fields?.player_id) return;

            const component = new PlayerComponent(record, this.state, () => this.updateScores());
            const playerElement = component.createElements();
            
            const { player_id } = record.fields;
            const teamPrefix = player_id.startsWith("ell") ? "ells" : "jacks";
            const positionType = player_id.split("-")[1];
            
            document.getElementById(`${teamPrefix}-${positionType}`)?.appendChild(playerElement);
        });

        this.updateScores();
    }

    updateScores() {
        const scores = {
            ell: 0,
            jack: 0
        };
        const values = {
            ell: 0,
            jack: 0
        };
        const penalties = {
            ell: 0,
            jack: 0
        };

        // Find penalty records for each team
        const ellPenaltyRecord = this.state.records.find(r => r.fields.player_id === 'ell-powerups');
        const jackPenaltyRecord = this.state.records.find(r => r.fields.player_id === 'jack-powerups');

        // Determine penalties from records
        if (ellPenaltyRecord && ellPenaltyRecord.fields.PEN) {
            penalties.ell = ellPenaltyRecord.fields.PEN;
        }
        if (jackPenaltyRecord && jackPenaltyRecord.fields.PEN) {
            penalties.jack = jackPenaltyRecord.fields.PEN;
        }

        document.querySelectorAll(".player").forEach(player => {
            const circle = player.querySelector(".position-circle");
            const scoreInput = player.querySelector("input[data-field='score']");
            const scoreValue = scoreInput.value.trim();
            const baseScore = scoreValue === '' ? 0 : (parseFloat(scoreValue) || 0);
            
            // Get state and determine multiplier
            const state = circle.dataset.state;
            let multiplier = 1;
            if (state === 'captain') multiplier = 2;
            else if (state === 'vice-captain') multiplier = 1.5;
            else if (state === 'triple-captain') multiplier = 3;
            
            const finalScore = state === 'benched' ? 0 : (baseScore * multiplier);
            
            const valueInput = player.querySelector("input[data-field='value']");
            const valueText = valueInput.value.trim().replace('£', '');
            const value = valueText === '' ? 0 : (parseFloat(valueText) || 0);
            
            const team = player.parentElement.id.startsWith("ells") ? "ell" : "jack";
            scores[team] += finalScore;
            values[team] += value;
        });

        // Apply penalties
        scores.ell -= penalties.ell || 0;
        scores.jack -= penalties.jack || 0;

        // Update display
        document.getElementById("jacks-score").textContent = Math.round(scores.jack);
        document.getElementById("ells-score").textContent = Math.round(scores.ell);
        
        const winnerDisplay = document.getElementById("winner-display");
        winnerDisplay.classList.remove("ell-winner", "jack-winner");

        if (scores.ell > scores.jack) {
            winnerDisplay.textContent = "Ell";
            winnerDisplay.classList.add("ell-winner");
        } else if (scores.jack > scores.ell) {
            winnerDisplay.textContent = "Jack";
            winnerDisplay.classList.add("jack-winner");
        } else {
            winnerDisplay.textContent = "Draw";
        }

        document.getElementById("jacks-value").textContent = `£${values.jack.toFixed(1)}`;
        document.getElementById("ells-value").textContent = `£${values.ell.toFixed(1)}`;
    }

    initializePowerups() {
        document.querySelectorAll('.powerup-button').forEach(button => {
            const team = button.dataset.team;
            const powerup = button.dataset.powerup;
            const playerPrefix = team === 'ells' ? 'ell' : 'jack';
            const record = this.state.records.find(r => 
                r.fields.player_id === `${playerPrefix}-powerups`
            );
            
            if (record && record.fields[powerup]) {
                button.classList.add('active');
            }

            button.addEventListener('click', () => this.togglePowerup(button, record.id));
        });
    }

    initializePenaltyDropdowns() {
        document.querySelectorAll('.penalty-dropdown').forEach(dropdown => {
            const team = dropdown.dataset.team;
            const playerPrefix = team === 'ells' ? 'ell' : 'jack';
            const record = this.state.records.find(r => 
                r.fields.player_id === `${playerPrefix}-powerups`
            );
            
            if (record && record.fields.PEN) {
                dropdown.value = record.fields.PEN;
            }

            dropdown.addEventListener('change', () => this.updatePenalty(dropdown, record.id));
        });
    }

    async togglePowerup(button, recordId) {
        const powerup = button.dataset.powerup;
        const isActive = button.classList.toggle('active');
        
        this.state.addChange({
            id: recordId,
            fields: {
                [powerup]: isActive
            }
        });
    }

    async updatePenalty(dropdown, recordId) {
        const penalty = parseInt(dropdown.value);
        
        this.state.addChange({
            id: recordId,
            fields: {
                PEN: penalty
            }
        });

        this.updateScores();
    }
}

publishChanges() {
        if (this.state.unsavedChanges.length === 0) {
            alert("No changes to publish.");
            return;
        }

        try {
            const loadingMsg = document.createElement('div');
            loadingMsg.style.position = 'fixed';
            loadingMsg.style.top = '50%';
            loadingMsg.style.left = '50%';
            loadingMsg.style.transform = 'translate(-50%, -50%)';
            loadingMsg.style.padding = '20px';
            loadingMsg.style.backgroundColor = 'white';
            loadingMsg.style.border = '1px solid #ccc';
            loadingMsg.style.borderRadius = '5px';
            loadingMsg.style.zIndex = '1000';
            loadingMsg.textContent = 'Publishing changes...';
            document.body.appendChild(loadingMsg);

            const publishPromises = this.state.unsavedChanges.map(change => 
                this.api.publishChange(change)
            );

            Promise.all(publishPromises)
                .then(results => {
                    document.body.removeChild(loadingMsg);
                    console.log("Changes published:", results);
                    alert("All changes published successfully!");
                    this.state.clearChanges();
                    this.updateScores();
                })
                .catch(error => {
                    document.body.removeChild(loadingMsg);
                    console.error("Failed to publish changes:", error);
                    alert("Error publishing changes. Please check your connection or contact support.");
                });
        } catch (error) {
            console.error("Failed to publish changes:", error);
            alert("Error publishing changes. Please check your connection or contact support.");
        }
    }

    resetTeamScores(team) {
        document.querySelectorAll(`#${team}-gk, #${team}-def, #${team}-mid, #${team}-fwd`)
            .forEach(position => {
                position.querySelectorAll('input[data-field="score"]').forEach(input => {
                    input.value = '';
                    
                    this.state.addChange({
                        id: input.dataset.id,
                        fields: { score: null }
                    });
                });
            });
        
        this.updateScores();
    }

    async fetchLeagueTableData() {
        const tableName = "Table%202";
        const url = `https://api.airtable.com/v0/${this.api.baseId}/${tableName}`;

        try {
            const response = await fetch(url, {
                headers: { 
                    'Authorization': `Bearer ${this.api.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch: ${response.statusText}`);
            }
            
            const data = await response.json();
            return data.records.sort((a, b) => a.fields.Week - b.fields.Week);
        } catch (error) {
            console.error("Fetch league table error:", error);
            throw error;
        }
    }

    openLeagueTable() {
        const modal = document.getElementById('league-table-modal');
        const tableBody = document.getElementById('league-table-body');
        
        this.fetchLeagueTableData()
            .then(records => {
                tableBody.innerHTML = '';
                
                // Calculate running totals
                let jackTotal = 0;
                let ellTotal = 0;
                
                records.forEach(record => {
                    const row = document.createElement('tr');
                    row.dataset.recordId = record.id;
                    
                    // Week column
                    const weekCell = document.createElement('td');
                    weekCell.textContent = record.fields.Week;
                    row.appendChild(weekCell);
                    
                    // Jack's score column
                    const jackCell = document.createElement('td');
                    const jackInput = document.createElement('input');
                    jackInput.type = 'text';
                    const jackValue = record.fields.Jack || '';
                    jackInput.value = jackValue;
                    jackInput.defaultValue = jackValue;
                    jackInput.dataset.field = 'Jack';
                    jackInput.addEventListener('blur', (e) => this.updateLeagueTableCell(record.id, e));
                    jackCell.appendChild(jackInput);
                    row.appendChild(jackCell);
                    
                    // Ell's score column
                    const ellCell = document.createElement('td');
                    const ellInput = document.createElement('input');
                    ellInput.type = 'text';
                    const ellValue = record.fields.Ell || '';
                    ellInput.value = ellValue;
                    ellInput.defaultValue = ellValue;
                    ellInput.dataset.field = 'Ell';
                    ellInput.addEventListener('blur', (e) => this.updateLeagueTableCell(record.id, e));
                    ellCell.appendChild(ellInput);
                    row.appendChild(ellCell);
                    
                    tableBody.appendChild(row);
                    
                    // Update running totals
                    jackTotal += parseFloat(jackValue) || 0;
                    ellTotal += parseFloat(ellValue) || 0;
                });
                
                // Add totals row
                const totalsRow = document.createElement('tr');
                totalsRow.style.fontWeight = 'bold';
                
                const totalsLabelCell = document.createElement('td');
                totalsLabelCell.textContent = 'Totals';
                totalsRow.appendChild(totalsLabelCell);
                
                const jackTotalCell = document.createElement('td');
                jackTotalCell.textContent = jackTotal.toFixed(1);
                totalsRow.appendChild(jackTotalCell);
                
                const ellTotalCell = document.createElement('td');
                ellTotalCell.textContent = ellTotal.toFixed(1);
                totalsRow.appendChild(ellTotalCell);
                
                tableBody.appendChild(totalsRow);
                
                // Show modal
                modal.style.display = 'block';
                
                // Close button functionality
                const closeButton = document.querySelector('.close-button');
                closeButton.onclick = () => {
                    modal.style.display = 'none';
                };
                
                // Close modal when clicking outside
                window.onclick = (event) => {
                    if (event.target == modal) {
                        modal.style.display = 'none';
                    }
                };
            })
            .catch(error => {
                alert('Failed to load league table');
                console.error(error);
            });
    }

async updateLeagueTableCell(recordId, event) {
        const input = event.target;
        const field = input.dataset.field;
        let value = input.value.trim();

        try {
            const numericValue = parseFloat(value);

            const response = await fetch(`https://api.airtable.com/v0/${this.api.baseId}/Table%202/${recordId}`, {
                method: "PATCH",
                headers: {
                    'Authorization': `Bearer ${this.api.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fields: {
                        [field]: isNaN(numericValue) ? null : numericValue
                    }
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Detailed error:', errorText);
                throw new Error(`Update failed: ${errorText}`);
            }

            // Show success feedback
            input.style.backgroundColor = '#90EE90';
            setTimeout(() => {
                input.style.backgroundColor = 'transparent';
            }, 1000);
            
            // Refresh the table to update totals
            this.openLeagueTable();
        } catch (error) {
            console.error('Error updating league table:', error);
            alert(`Failed to update league table: ${error.message}`);
            input.value = input.defaultValue;
        }
    }

    openCalculator() {
        const modal = document.getElementById('calculator-modal');
        const content = document.getElementById('calculator-content');
        
        // First time opening, inject the calculator HTML
        if (!content.querySelector('.calculator')) {
            content.innerHTML += `
            <div class="calculator">
                <!-- Role Selection -->
                <div class="row">
                    <label>Select Role</label>
                    <div class="icon-group">
                        <button class="role-button" data-role="10">🧤 GK</button>
                        <button class="role-button" data-role="6">🛡️ DEF</button>
                        <button class="role-button" data-role="5">⚡ MID</button>
                        <button class="role-button" data-role="4">🎯 FWD</button>
                    </div>
                </div>

                <!-- Game Time -->
                <div class="row">
                    <label>Game Time</label>
                    <div class="icon-group">
                        <button class="event-button" data-points="1">⏱️ First Half</button>
                        <button class="event-button" data-points="1">⏱️ Second Half</button>
                    </div>
                </div>

                <!-- Goals -->
                <div class="row">
                    <label>Goals</label>
                    <div class="icon-group grid-layout">
                        ${Array(10).fill('<button class="goal-button">⚽</button>').join('')}
                    </div>
                </div>

                <!-- Assists -->
                <div class="row">
                    <label>Assists</label>
                    <div class="icon-group grid-layout">
                        ${Array(10).fill('<button class="event-button" data-points="3">🥾</button>').join('')}
                    </div>
                </div>

                <!-- Conceded Goal -->
                <div class="row">
                    <label>Conceded Goal</label>
                    <div class="icon-group grid-layout">
                        ${Array(10).fill('<button class="event-button" data-points="-1">❌</button>').join('')}
                    </div>
                </div>

                <!-- Own Goal -->
                <div class="row">
                    <label>Own Goal</label>
                    <div class="icon-group">
                        ${Array(5).fill('<button class="event-button" data-points="-2">🏈</button>').join('')}
                    </div>
                </div>

                <!-- Penalty Miss -->
                <div class="row">
                    <label>Penalty Miss</label>
                    <div class="icon-group">
                        ${Array(5).fill('<button class="event-button" data-points="-3">🥅</button>').join('')}
                    </div>
                </div>

                <!-- Cards Section -->
                <div class="row">
                    <label>Cards</label>
                    <div class="icon-group">
                        <button class="event-button" data-points="-3">🟥 Red Card</button>
                        <button class="event-button" data-points="-1">🟨 Yellow Card</button>
                    </div>
                </div>

                <!-- Clean Sheet -->
                <div class="row">
                    <label>Clean Sheet</label>
                    <div class="icon-group">
                        <button class="event-button" data-points="4">⬜️ Clean Sheet</button>
                    </div>
                </div>

                <!-- Total Score -->
                <div class="score-display">
                    Total Score: <span id="total-score">0</span>
                </div>

                <!-- Reset Button -->
                <div class="row">
                    <button id="reset-button" class="reset-button">Reset</button>
                </div>

                <!-- Value Calculator Section -->
                <div class="value-calculator">
                    <h2>Player Value Calculator</h2>
                    <div class="row">
                        <label>Real World Value (£)</label>
                        <input type="number" id="real-world-value" step="0.1" min="0" placeholder="Enter value in millions">
                    </div>
                    
                    <div class="row">
                        <label>Position</label>
                        <div class="position-select">
                            <button class="position-button" data-bonus="6">FWD</button>
                            <button class="position-button" data-bonus="5">MID</button>
                            <button class="position-button" data-bonus="4">DEF</button>
                            <button class="position-button" data-bonus="3">GK</button>
                        </div>
                    </div>

                    <!-- Calculate Button -->
                    <div class="row">
                        <button id="calculate-button" class="calculate-button">Calculate Value</button>
                    </div>

                    <div class="value-display">
                        <div class="value-row">
                            <span>FFS Value:</span>
                            <span id="ffs-value">£0.0</span>
                        </div>
                    </div>
                </div>
            </div>`;

            // Inject calculation logic
            const calculatorScript = document.createElement('script');
            calculatorScript.innerHTML = `
            // Calculator Logic
            let totalScore = 0;
            let roleMultiplier = 0;
            let selectedPositionBonus = 0;

            const totalScoreDisplay = document.getElementById('total-score');
            const realWorldValueInput = document.getElementById('real-world-value');
            const ffsValueDisplay = document.getElementById('ffs-value');
            const positionButtons = document.querySelectorAll('.position-button');
            const calculateButton = document.getElementById('calculate-button');

            function updateScoreDisplay() {
                totalScoreDisplay.textContent = totalScore;
            }

            function resetAllButtons() {
                document.querySelectorAll('button').forEach(button => button.classList.remove('active'));
            }

            function resetAll() {
                totalScore = 0;
                roleMultiplier = 0;
                resetAllButtons();
                updateScoreDisplay();
                
                realWorldValueInput.value = '';
                positionButtons.forEach(btn => btn.classList.remove('active'));
                selectedPositionBonus = 0;
                ffsValueDisplay.textContent = '£0.0';
            }

            document.querySelectorAll('.role-button').forEach(button => {
                button.addEventListener('click', () => {
                    document.querySelectorAll('.role-button').forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                    roleMultiplier = parseInt(button.dataset.role);
                });
            });

            document.querySelectorAll('.event-button').forEach(button => {
                button.addEventListener('click', () => {
                    const points = parseInt(button.dataset.points);
                    if (button.classList.contains('active')) {
                        button.classList.remove('active');
                        totalScore -= points;
                    } else {
                        button.classList.add('active');
                        totalScore += points;
                    }
                    updateScoreDisplay();
                });
            });

            document.querySelectorAll('.goal-button').forEach(button => {
                button.addEventListener('click', () => {
                    if (roleMultiplier === 0) {
                        alert('Please select a role first!');
                        return;
                    }

                    const points = roleMultiplier;
                    if (button.classList.contains('active')) {
                        button.classList.remove('active');
                        totalScore -= points;
                    } else {
                        button.classList.add('active');
                        totalScore += points;
                    }
                    updateScoreDisplay();
                });
            });

            positionButtons.forEach(button => {
                button.addEventListener('click', () => {
                    positionButtons.forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                    selectedPositionBonus = parseFloat(button.dataset.bonus);
                });
            });

            calculateButton.addEventListener('click', () => {
                const realWorldValue = parseFloat(realWorldValueInput.value) || 0;
                
                if (selectedPositionBonus === 0) {
                    alert('Please select a position first!');
                    return;
                }
                
                if (realWorldValue === 0) {
                    alert('Please enter a real world value!');
                    return;
                }
                
                const baseValue = realWorldValue * 0.69;
                const ffsValue = baseValue + selectedPositionBonus;
                ffsValueDisplay.textContent = `£${ffsValue.toFixed(1)}`;
            });

            document.getElementById('reset-button').addEventListener('click', resetAll);
            `;
            content.appendChild(calculatorScript);
        }

        // Show the modal
        modal.style.display = 'block';
        
        // Close button functionality
        const closeButton = content.querySelector('.close-button');
        closeButton.onclick = () => {
            modal.style.display = 'none';
        };
        
        // Close modal when clicking outside
        window.onclick = (event) => {
            if (event.target == modal) {
                modal.style.display = 'none';
            }
        };
    }
}

// Initialize the app and make it globally accessible
window.app = new FantasyFootballApp();
