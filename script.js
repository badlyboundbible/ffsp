// script.js - Part 1: Constants and Utility Functions
const TEAM_COLORS = {
    ABD: "#e2001a",
    CEL: "#16973b",
    HEA: "#800910",
    HIB: "#005000",
    KIL: "#0e00f7",
    MOT: "#ffbe00",
    RAN: "#1b458f",
    SMN: "#000000",
    SJN: "#243f90",
    DUN: "#1a315a",
    DDU: "#f29400",
    ROS: "#040957"
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

// script.js - Part 2: FantasyState and AirtableService Classes
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

// script.js - Part 3: PlayerComponent Class
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
            roleContainer: this.createRoleContainer(),
            circle: this.createPositionCircle(),
            name: this.createInput("name", fields.name),
            team: this.createTeamSelect(),
            value: this.createInput("value", this.formatValue(fields.value)),
            score: this.createScoreInput(fields.score)
        };

        Object.values(elements).forEach(element => playerDiv.appendChild(element));
        return playerDiv;
    }

    createRoleContainer() {
        const container = document.createElement("div");
        container.className = "role-container";
        
        let role = PLAYER_ROLES.NONE;
        if (this.record.fields.TC) {
            role = PLAYER_ROLES.TRIPLE_CAPTAIN;
        } else if (this.record.fields.C) {
            role = PLAYER_ROLES.CAPTAIN;
        } else if (this.record.fields.VC) {
            role = PLAYER_ROLES.VICE_CAPTAIN;
        }
        
        const roleButton = document.createElement("button");
        roleButton.className = "role-button";
        roleButton.textContent = this.getRoleDisplay(role);
        roleButton.dataset.role = role;
        roleButton.addEventListener("click", () => this.cycleRole(roleButton));
        
        container.appendChild(roleButton);
        return container;
    }

    getRoleDisplay(role) {
        switch(role) {
            case PLAYER_ROLES.CAPTAIN:
                return "C";
            case PLAYER_ROLES.VICE_CAPTAIN:
                return "VC";
            case PLAYER_ROLES.TRIPLE_CAPTAIN:
                return "TC";
            default:
                return "";
        }
    }

    cycleRole(button) {
        const currentRole = button.dataset.role;
        
        let nextRole;
        switch(currentRole) {
            case PLAYER_ROLES.NONE:
                nextRole = PLAYER_ROLES.CAPTAIN;
                break;
            case PLAYER_ROLES.CAPTAIN:
                nextRole = PLAYER_ROLES.VICE_CAPTAIN;
                break;
            case PLAYER_ROLES.VICE_CAPTAIN:
                nextRole = PLAYER_ROLES.TRIPLE_CAPTAIN;
                break;
            case PLAYER_ROLES.TRIPLE_CAPTAIN:
            default:
                nextRole = PLAYER_ROLES.NONE;
        }

        button.dataset.role = nextRole;
        button.textContent = this.getRoleDisplay(nextRole);
        
        this.state.addChange({
            id: this.record.id,
            fields: {
                'C': nextRole === PLAYER_ROLES.CAPTAIN,
                'VC': nextRole === PLAYER_ROLES.VICE_CAPTAIN,
                'TC': nextRole === PLAYER_ROLES.TRIPLE_CAPTAIN
            }
        });

        this.onUpdate();
    }

    createPositionCircle() {
        const circle = document.createElement("div");
        const { fields } = this.record;
        const positionType = fields.player_id.split("-")[1];
        
        circle.className = "position-circle";
        circle.textContent = positionType.toUpperCase();
        circle.style.backgroundColor = fields.bench ? "#888888" : TEAM_COLORS[fields.team] || "#cccccc";
        circle.dataset.id = this.record.id;
        circle.dataset.bench = fields.bench || false;
        circle.dataset.team = fields.team;
        
        circle.addEventListener("click", () => this.toggleBench(circle));
        
        return circle;
    }

    formatValue(value) {
        if (value === undefined || value === null || value === '') {
            return '';
        }
        return `£${parseFloat(value).toFixed(1)}`;
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

    toggleBench(circle) {
        const newBenchStatus = circle.dataset.bench !== "true";
        circle.dataset.bench = newBenchStatus;
        circle.style.backgroundColor = newBenchStatus ? "#888888" : TEAM_COLORS[circle.dataset.team];
        
        this.state.addChange({
            id: circle.dataset.id,
            fields: { bench: newBenchStatus }
        });
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

    updateTeamColors(select) {
        const selectedTeam = select.value;
        select.style.backgroundColor = TEAM_COLORS[selectedTeam];
        select.style.color = "white";
    }
}

// script.js - Part 4: FantasyFootballApp Class
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
            const scoreInput = player.querySelector("input[data-field='score']");
            const scoreValue = scoreInput.value.trim();
            const baseScore = scoreValue === '' ? 0 : (parseFloat(scoreValue) || 0);
            
            const roleButton = player.querySelector('.role-button');
            const role = roleButton ? roleButton.dataset.role : PLAYER_ROLES.NONE;
            const multiplier = ROLE_MULTIPLIERS[role] || 1;
            const finalScore = baseScore * multiplier;
            
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

        // Round scores to nearest whole number
        document.getElementById("jacks-score").textContent = Math.round(scores.jack);
        document.getElementById("ells-score").textContent = Math.round(scores.ell);
        
        document.getElementById("winner-display").textContent = 
            scores.ell > scores.jack ? "Ell" : 
            scores.jack > scores.ell ? "Jack" : "Draw";

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

        // Initialize penalty dropdowns
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

        // Immediately update scores
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
    // Add these methods to the FantasyFootballApp class in script.js

// New Airtable service for Table 2
async fetchLeagueTableData() {
    const baseId = "appoF7fRSS4nuF9u2";
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

// Method to open league table modal
async openLeagueTable() {
    const modal = document.getElementById('league-table-modal');
    const tableBody = document.getElementById('league-table-body');
    
    try {
        // Fetch league table data
        const records = await this.fetchLeagueTableData();
        
        // Clear existing rows
        tableBody.innerHTML = '';
        
        // Populate table
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
            jackInput.value = record.fields.Jack || '';
            jackInput.dataset.field = 'Jack';
            jackInput.addEventListener('blur', (e) => this.updateLeagueTableCell(record.id, e));
            jackCell.appendChild(jackInput);
            row.appendChild(jackCell);
            
            // Ell's score column
            const ellCell = document.createElement('td');
            const ellInput = document.createElement('input');
            ellInput.type = 'text';
            ellInput.value = record.fields.Ell || '';
            ellInput.dataset.field = 'Ell';
            ellInput.addEventListener('blur', (e) => this.updateLeagueTableCell(record.id, e));
            ellCell.appendChild(ellInput);
            row.appendChild(ellCell);
            
            tableBody.appendChild(row);
        });
        
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
    } catch (error) {
        alert('Failed to load league table');
    }
}

// Method to update a cell in the league table
async updateLeagueTableCell(recordId, event) {
    const input = event.target;
    const field = input.dataset.field;
    let value = input.value.trim();

    try {
        // Attempt to parse the input as a number
        const numericValue = parseFloat(value);

        // Update the field with the parsed numeric value or null if empty
        const response = await fetch(`https://api.airtable.com/v0/appoF7fRSS4nuF9u2/Table%202/${recordId}`, {
            method: "PATCH",
            headers: {
                'Authorization': `Bearer patIQZcsLZw1aCILS.3d2edb2f1380092318363d8ffd99f1a695ff6db84c300d36e2be82288d4b3489`,
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

        // Provide success feedback
        input.style.backgroundColor = '#90EE90';
        setTimeout(() => {
            input.style.backgroundColor = 'transparent';
        }, 1000);
    } catch (error) {
        console.error('Error updating league table:', error);
        alert(`Failed to update league table: ${error.message}`);

        // Revert the input to its previous value
        input.value = input.defaultValue;
    }
}

// Modified openLeagueTable method to include totals
async openLeagueTable() {
    const modal = document.getElementById('league-table-modal');
    const tableBody = document.getElementById('league-table-body');
    
    try {
        // Fetch league table data
        const records = await this.fetchLeagueTableData();
        
        // Clear existing rows
        tableBody.innerHTML = '';
        
        // Calculate totals
        let jackTotal = 0;
        let ellTotal = 0;
        
        // Populate table
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
            jackInput.defaultValue = jackValue;  // Store original value
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
            ellInput.defaultValue = ellValue;  // Store original value
            ellInput.dataset.field = 'Ell';
            ellInput.addEventListener('blur', (e) => this.updateLeagueTableCell(record.id, e));
            ellCell.appendChild(ellInput);
            row.appendChild(ellCell);
            
            tableBody.appendChild(row);
            
            // Calculate totals
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
    } catch (error) {
        alert('Failed to load league table');
        console.error(error);
    }
}
    async publishScores() {
    try {
        // Get the current scores from the main interface
        const jackScore = parseFloat(document.getElementById("jacks-score").textContent);
        const ellScore = parseFloat(document.getElementById("ells-score").textContent);

        // Find the next available row in the league table
        const records = await this.fetchLeagueTableData();
        const nextWeek = records.length + 1;

        // Update the league table with the new scores
        await this.updateLeagueTableRow(nextWeek, jackScore, ellScore);

        // Provide feedback to the user
        alert("Scores published successfully!");
    } catch (error) {
        console.error("Error publishing scores:", error);
        alert(`Failed to publish scores: ${error.message}`);
    }
}

async updateLeagueTableRow(week, jackScore, ellScore) {
    try {
        // Find the record with the matching week number
        const records = await this.fetchLeagueTableData();
        const record = records.find(r => r.fields.Week === week);

        if (!record) {
            throw new Error(`No record found for week ${week}`);
        }

        // Update the record with the new scores
        const response = await fetch(`https://api.airtable.com/v0/appoF7fRSS4nuF9u2/Table%202/${record.id}`, {
            method: "PATCH",
            headers: {
                'Authorization': `Bearer patIQZcsLZw1aCILS.3d2edb2f1380092318363d8ffd99f1a695ff6db84c300d36e2be82288d4b3489`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fields: {
                    Jack: jackScore,
                    Ell: ellScore
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Update failed: ${errorText}`);
        }
    } catch (error) {
        console.error("Error updating league table row:", error);
        throw error;
    }
}

// Initialize application
const app = new FantasyFootballApp();
