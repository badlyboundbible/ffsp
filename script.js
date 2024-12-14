// Constants
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

// Utility function
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Class declarations
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

class PlayerComponent {
    constructor(record, state, onUpdate) {
        this.record = record;
        this.state = state;
        this.onUpdate = onUpdate;
    }

    // ... rest of PlayerComponent methods ...
    // [Keep all your existing PlayerComponent methods here]
}

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
        const jacksPenalty = parseInt(document.querySelector('.penalty-select[data-team="jacks"]').value) || 0;
        const ellsPenalty = parseInt(document.querySelector('.penalty-select[data-team="ells"]').value) || 0;
        
        scores.jack += jacksPenalty;
        scores.ell += ellsPenalty;

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
        document.querySelectorAll('.penalty-select').forEach(select => {
            const team = select.dataset.team;
            const playerPrefix = team === 'ells' ? 'ell' : 'jack';
            const record = this.state.records.find(r => 
                r.fields.player_id === `${playerPrefix}-powerups`
            );
            
            if (record && record.fields.PEN !== undefined) {
                select.value = record.fields.PEN;
            }

            select.addEventListener('change', (e) => {
                if (record) {
                    this.state.addChange({
                        id: record.id,
                        fields: { PEN: parseInt(e.target.value) }
                    });
                }
                this.updateScores();
            });
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
}
