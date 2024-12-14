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

    // ... rest of FantasyFootballApp methods ...
    // [Keep all your existing FantasyFootballApp methods here]
}

// Initialize application
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new FantasyFootballApp();
    
    // Add click handlers
    document.getElementById('publish-button').addEventListener('click', () => {
        app.publishChanges();
    });

    document.querySelectorAll('.reset-button').forEach(button => {
        button.addEventListener('click', () => {
            app.resetTeamScores(button.dataset.team);
        });
    });
});
