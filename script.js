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

    async fetchLeagueTableData() {
        const tableName = "Table%202";
        const url = `https://api.airtable.com/v0/${this.baseId}/${tableName}`;

        try {
            const response = await fetch(url, {
                headers: { 
                    'Authorization': `Bearer ${this.apiKey}`,
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
}

// PlayerComponent Class
class PlayerComponent {
    constructor(record, state, onUpdate) {
        this.record = record;
        this.state = state;
        this.onUpdate = onUpdate;
    }

    createElements() {
        const { fields } = this.record;
        const playerDiv = document.createElement("div");
        playerDiv.className = "player";

        const elements = {
            circle: this.createPositionCircle(),
            name: this.createInput("name", fields.name),
            team: this.createTeamSelect(),
            value: this.createInput("value", this.formatValue(fields.value)),
            score: this.createScoreInput(fields.score)
        };

        Object.values(elements).forEach(element => playerDiv.appendChild(element));
        return playerDiv;
    }

    createPositionCircle() {
        const { fields } = this.record;
        const positionType = fields.player_id.split("-")[1];
        
        const circle = document.createElement("div");
        circle.className = "position-circle";
        circle.dataset.id = this.record.id;
        
        const positionText = document.createElement("div");
        positionText.className = "position-text";
        positionText.textContent = positionType.toUpperCase();
        
        const roleText = document.createElement("div");
        roleText.className = "role-text";
        
        circle.appendChild(positionText);
        circle.appendChild(roleText);
        
        // Set initial state based on saved data
        let state = 'active';  // default state
        if (fields.TC) state = 'triple-captain';
        else if (fields.C) state = 'captain';
        else if (fields.VC) state = 'vice-captain';
        else if (fields.bench) state = 'benched';
        
        this.updateCircleState(circle, state, fields.team);
        
        circle.addEventListener("click", () => this.cycleState(circle));
        
        return circle;
    }

    cycleState(circle) {
        const currentState = circle.dataset.state;
        const team = circle.dataset.team;
        
        const states = ['active', 'captain', 'vice-captain', 'triple-captain', 'benched'];
        let nextStateIndex = (states.indexOf(currentState) + 1) % states.length;
        let nextState = states[nextStateIndex];
        
        this.updateCircleState(circle, nextState, team);
        
        this.state.addChange({
            id: this.record.id,
            fields: {
                'C': nextState === 'captain',
                'VC': nextState === 'vice-captain',
                'TC': nextState === 'triple-captain',
                'bench': nextState === 'benched'
            }
        });

        this.onUpdate();
    }

    updateCircleState(circle, state, team) {
        const roleText = circle.querySelector('.role-text');
        circle.dataset.state = state;
        circle.dataset.team = team;

        circle.classList.remove('captain', 'vice-captain', 'triple-captain', 'benched');
        
        switch(state) {
            case 'captain':
                roleText.textContent = 'C';
                circle.classList.add('captain');
                circle.style.backgroundColor = '#ffd700';
                break;
            case 'vice-captain':
                roleText.textContent = 'VC';
                circle.classList.add('vice-captain');
                circle.style.backgroundColor = '#c0c0c0';
                break;
            case 'triple-captain':
                roleText.textContent = 'TC';
                circle.classList.add('triple-captain');
                circle.style.backgroundColor = '#ff69b4';
                break;
            case 'benched':
                roleText.textContent = '';
                circle.classList.add('benched');
                circle.style.backgroundColor = '#8B4513';
                break;
            default:
                roleText.textContent = '';
                circle.style.backgroundColor = TEAM_COLORS[team];
        }
    }

    createInput(field, value) {
        const input = document.createElement("input");
        input.value = value || '';
        input.dataset.field = field;
        input.dataset.id = this.record.id;
        
        if (field !== "score") {
            input.style.backgroundColor = this.record.fields.player_id.startsWith("ell") ? "#ffcccc" : "#cceeff";
        }
        
        input.addEventListener("blur", (e) => this.handleChange(e));
        return input;
    }

    createScoreInput(score) {
        const input = document.createElement("input");
        input.value = score || '';
        input.dataset.field = "score";
        input.dataset.id = this.record.id;
        input.style.backgroundColor = "white";
        input.addEventListener("blur", (e) => this.handleChange(e));
        return input;
    }

    formatValue(value) {
        if (value === undefined || value === null || value === '') {
            return '';
        }
        return `£${parseFloat(value).toFixed(1)}`;
    }

    createTeamSelect() {
        const select = document.createElement("select");
        select.dataset.field = "team";
        select.dataset.id = this.record.id;
        
        Object.keys(TEAM_COLORS).forEach(team => {
            const option = document.createElement("option");
            option.value = team;
            option.textContent = team;
            option.selected = team === this.record.fields.team;
            select.appendChild(option);
        });

        select.addEventListener("change", (e) => {
            this.handleChange(e);
            this.updateTeamColors(select);
        });
        
        this.updateTeamColors(select);
        return select;
    }

    updateTeamColors(select) {
        const selectedTeam = select.value;
        select.style.backgroundColor = TEAM_COLORS[selectedTeam];
        select.style.color = "white";
    }

    handleChange(event) {
        const input = event.target;
        let value = input.value.trim();
    
        if (value === '') {
            value = null;
        } else if (input.dataset.field === "score" || input.dataset.field === "value") {
            value = input.dataset.field === "value" ? 
                parseFloat(value.replace('£', '')) || 0 :
                parseFloat(value) || 0;
        }

        this.state.addChange({
            id: input.dataset.id,
            fields: { [input.dataset.field]: value }
        });

        if (input.dataset.field === "score" || input.dataset.field === "value") {
            this.onUpdate();
        }
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
        } catch (error) {
            console.error("Failed to load data:", error);
        }
    }

    async refreshData() {
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
            loadingMsg.textContent = 'Refreshing...';
            document.body.appendChild(loadingMsg);

            const records = await this.api.fetchData();
            this.state.setRecords(records);
            this.displayPlayers(records);
            this.initializePowerups();
            
            document.body.removeChild(loadingMsg);
        } catch (error) {
            console.error("Failed to refresh data:", error);
            alert("Error refreshing data. Please check your connection or try again.");
        }
    }

    openCalculator() {
        const modal = document.getElementById('calculator-modal');
        modal.style.display = 'block';

        // Close button functionality
        const closeButton = modal.querySelector('.close-button');
        closeButton.onclick = () => {
            modal.style.display = 'none';
            this.resetCalculator();
        };

        // Close modal when clicking outside
        window.onclick = (event) => {
            if (event.target == modal) {
                modal.style.display = 'none';
                this.resetCalculator();
            }
        };

        // Initialize calculator functionality
        this.initializeCalculator();
    }

    resetCalculator() {
        const totalScoreDisplay = document.getElementById('total-score');
        
        // Reset total score
        totalScoreDisplay.textContent = '0';

        // Reset all buttons
        document.querySelectorAll('.calculator button').forEach(button => {
            if (!button.classList.contains('position-button') && 
                button.id !== 'calculate-button') {
                button.classList.remove('active');
            }
        });

        // Reset real-world value input
        document.getElementById('real-world-value').value = '';
        document.getElementById('ffs-value').textContent = '£0.0';

        // Deselect position buttons
        document.querySelectorAll('.position-button').forEach(btn => btn.classList.remove('active'));
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

        // Find penalty records
        const ellPenaltyRecord = this.state.records.find(r => r.fields.player_id === 'ell-powerups');
        const jackPenaltyRecord = this.state.records.find(r => r.fields.player_id === 'jack-powerups');

        // Get penalties
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
            
            // Get multiplier based on state
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

        this.initializePenaltyDropdowns();
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

    async publishChanges() {
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

            const results = [];
            for (const change of this.state.unsavedChanges) {
                const result = await this.api.publishChange(change);
                results.push(result);
            }
            
            document.body.removeChild(loadingMsg);
            console.log("Changes published:", results);
            alert("All changes published successfully!");
            this.state.clearChanges();
            this.updateScores();
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

initializeCalculator() {
        let totalScore = 0;
        let roleMultiplier = 0;
        let selectedPositionBonus = 0;

        const totalScoreDisplay = document.getElementById('total-score');
        const realWorldValueInput = document.getElementById('real-world-value');
        const ffsValueDisplay = document.getElementById('ffs-value');

        // Role selection logic
        document.querySelectorAll('.role-button').forEach(button => {
            button.addEventListener('click', () => {
                document.querySelectorAll('.role-button').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                roleMultiplier = parseInt(button.dataset.role);
            });
        });

        // Game Time buttons - 1 point per half
        document.querySelectorAll('.event-button').forEach(button => {
            if (button.textContent.includes('⏱️')) {
                button.addEventListener('click', () => {
                    if (button.classList.contains('active')) {
                        button.classList.remove('active');
                        totalScore -= 1;
                    } else {
                        button.classList.add('active');
                        totalScore += 1;
                    }
                    totalScoreDisplay.textContent = totalScore;
                });
            }
        });

        // Goal button logic - points based on role
        document.querySelectorAll('.goal-button').forEach(button => {
            button.addEventListener('click', () => {
                if (roleMultiplier === 0) {
                    alert('Please select a role first!');
                    return;
                }

                // Points based on role
                if (button.classList.contains('active')) {
                    button.classList.remove('active');
                    totalScore -= roleMultiplier;
                } else {
                    button.classList.add('active');
                    totalScore += roleMultiplier;
                }
                totalScoreDisplay.textContent = totalScore;
            });
        });

        // Assists - 3 points
        document.querySelectorAll('.event-button[data-points="3"]').forEach(button => {
            button.addEventListener('click', () => {
                if (button.classList.contains('active')) {
                    button.classList.remove('active');
                    totalScore -= 3;
                } else {
                    button.classList.add('active');
                    totalScore += 3;
                }
                totalScoreDisplay.textContent = totalScore;
            });
        });

        // Conceded Goal - -1 point
        document.querySelectorAll('.event-button[data-points="-1"]').forEach(button => {
            button.addEventListener('click', () => {
                if (button.classList.contains('active')) {
                    button.classList.remove('active');
                    totalScore += 1;
                } else {
                    button.classList.add('active');
                    totalScore -= 1;
                }
                totalScoreDisplay.textContent = totalScore;
            });
        });

        // Own Goal - -2 points
        document.querySelectorAll('.event-button[data-points="-2"]').forEach(button => {
            button.addEventListener('click', () => {
                if (button.classList.contains('active')) {
                    button.classList.remove('active');
                    totalScore += 2;
                } else {
                    button.classList.add('active');
                    totalScore -= 2;
                }
                totalScoreDisplay.textContent = totalScore;
            });
        });

        // Penalty Miss or Red Card - -3 points
        document.querySelectorAll('.event-button[data-points="-3"]').forEach(button => {
            button.addEventListener('click', () => {
                if (button.classList.contains('active')) {
                    button.classList.remove('active');
                    totalScore += 3;
                } else {
                    button.classList.add('active');
                    totalScore -= 3;
                }
                totalScoreDisplay.textContent = totalScore;
            });
        });

        // Clean Sheet - 4 points
        document.querySelectorAll('.event-button[data-points="4"]').forEach(button => {
            button.addEventListener('click', () => {
                if (button.classList.contains('active')) {
                    button.classList.remove('active');
                    totalScore -= 4;
                } else {
                    button.classList.add('active');
                    totalScore += 4;
                }
                totalScoreDisplay.textContent = totalScore;
            });
        });

        // Value calculator position buttons
        document.querySelectorAll('.position-button').forEach(button => {
            button.addEventListener('click', () => {
                document.querySelectorAll('.position-button').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                selectedPositionBonus = parseFloat(button.dataset.bonus);
            });
        });

        // Calculate value button
        document.getElementById('calculate-button').addEventListener('click', () => {
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

        // Reset button
        document.getElementById('reset-button').addEventListener('click', () => {
            totalScore = 0;
            roleMultiplier = 0;
            totalScoreDisplay.textContent = '0';

            // Reset all buttons
            document.querySelectorAll('.calculator button').forEach(button => {
                if (!button.classList.contains('position-button') && 
                    button.id !== 'calculate-button') {
                    button.classList.remove('active');
                }
            });
        });
    }
}

// Initialize application
const app = new FantasyFootballApp();
