// script.js
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
        this.apiKey = "YOUR_API_KEY";
        this.baseId = "YOUR_BASE_ID";
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
        });
    }

    async publishChange(change) {
        return this.queueRequest(async () => {
            const sanitizedFields = {};
            Object.keys(change.fields).forEach(key => {
                sanitizedFields[key] = change.fields[key];
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
        });
    }
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
        const records = await this.api.fetchData();
        this.state.setRecords(records);
        this.displayPlayers(records);
    }

    displayPlayers(records) {
        records.forEach(record => {
            // Code to display players
        });
    }

    applyPenalty(team, penaltyValue) {
        const penalty = parseInt(penaltyValue, 10);
        const penaltyRecordId = team === 'ell' ? 'ell-powerups' : 'jack-powerups';

        this.state.addChange({
            id: penaltyRecordId,
            fields: { PEN: penalty }
        });

        const currentScoreElement = document.getElementById(`${team}s-score`);
        const baseScore = parseInt(currentScoreElement.textContent, 10) || 0;
        const updatedScore = baseScore + penalty;
        currentScoreElement.textContent = updatedScore;

        this.updateScores();
    }

    updateScores() {
        const penalties = {
            ell: parseInt(document.getElementById('ell-penalty').value, 10) || 0,
            jack: parseInt(document.getElementById('jack-penalty').value, 10) || 0,
        };

        const scores = { ell: 0, jack: 0 };

        document.querySelectorAll(".player").forEach(player => {
            // Update player scores logic
        });

        scores.ell += penalties.ell;
        scores.jack += penalties.jack;

        document.getElementById("ells-score").textContent = Math.round(scores.ell);
        document.getElementById("jacks-score").textContent = Math.round(scores.jack);

        document.getElementById("winner-display").textContent = 
            scores.ell > scores.jack ? "Ell" : 
            scores.jack > scores.ell ? "Jack" : "Draw";
    }

    async publishChanges() {
        if (this.state.unsavedChanges.length === 0) {
            alert("No changes to publish.");
            return;
        }
        const results = [];
        for (const change of this.state.unsavedChanges) {
            const result = await this.api.publishChange(change);
            results.push(result);
        }
        alert("All changes published successfully!");
        this.state.clearChanges();
    }
}

const app = new FantasyFootballApp();
