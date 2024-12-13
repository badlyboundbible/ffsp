// Constants and configuration
const CONFIG = {
    API: {
        key: "patIQZcsLZw1aCILS.3d2edb2f1380092318363d8ffd99f1a695ff6db84c300d36e2be82288d4b3489",
        baseId: "appoF7fRSS4nuF9u2",
        tableName: "Table 1",
        get url() {
            return `https://api.airtable.com/v0/${this.baseId}/${this.tableName}`;
        }
    },
    TEAMS: {
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
    }
};

// State management
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

// API service
class AirtableService {
    constructor(config) {
        this.config = config;
    }

    async fetchData() {
        try {
            const response = await fetch(this.config.url, {
                headers: { Authorization: `Bearer ${this.config.key}` }
            });
            if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
            return (await response.json()).records;
        } catch (error) {
            console.error("Fetch error:", error);
            throw error;
        }
    }

    async publishChange(change) {
        const sanitizedFields = this.sanitizeFields(change.fields);
        
        try {
            const response = await fetch(`${this.config.url}/${change.id}`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${this.config.key}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ fields: sanitizedFields })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Update failed for ${change.id}: ${errorText}`);
            }
            
            return response.json();
        } catch (error) {
            console.error(`Error updating ${change.id}:`, error);
            throw error;
        }
    }

    sanitizeFields(fields) {
        return Object.fromEntries(
            Object.entries(fields).map(([key, value]) => [
                key,
                key === "score" || key === "value" ? parseFloat(value) : value
            ])
        );
    }
}

// UI Components
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
            value: this.createInput("value", `£${parseFloat(fields.value).toFixed(1)}`),
            score: this.createInput("score", fields.score)
        };

        Object.values(elements).forEach(element => playerDiv.appendChild(element));
        return playerDiv;
    }

    createPositionCircle() {
        const { fields } = this.record;
        const circle = document.createElement("div");
        circle.className = "position-circle";
        circle.textContent = fields.player_id.split("-")[1].toUpperCase();
        circle.style.backgroundColor = fields.bench ? "#888888" : CONFIG.TEAMS[fields.team];
        circle.dataset.id = this.record.id;
        circle.dataset.bench = fields.bench;
        circle.dataset.team = fields.team;
        circle.addEventListener("click", () => this.toggleBench(circle));
        return circle;
    }

    createInput(field, value) {
        const input = document.createElement("input");
        input.value = value;
        input.dataset.field = field;
        input.dataset.id = this.record.id;
        input.style.backgroundColor = this.record.fields.player_id.startsWith("ell") ? "#ffcccc" : "#cceeff";
        input.addEventListener("blur", (e) => this.handleChange(e));
        return input;
    }

    createTeamSelect() {
        const select = document.createElement("select");
        select.dataset.field = "team";
        select.dataset.id = this.record.id;
        
        Object.keys(CONFIG.TEAMS).forEach(team => {
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
        circle.style.backgroundColor = newBenchStatus ? "#888888" : CONFIG.TEAMS[circle.dataset.team];
        
        this.state.addChange({
            id: circle.dataset.id,
            fields: { bench: newBenchStatus }
        });
    }

    handleChange(event) {
        const input = event.target;
        let value = input.value;
        
        if (input.dataset.field === "score" || input.dataset.field === "value") {
            value = parseFloat(value.replace("£", "")) || 0;
        }

        this.state.addChange({
            id: input.dataset.id,
            fields: { [input.dataset.field]: value }
        });

        if (input.dataset.field === "score") {
            this.onUpdate();
        }
    }

    updateTeamColors(select) {
        const selectedTeam = select.value;
        select.style.backgroundColor = CONFIG.TEAMS[selectedTeam];
        select.style.color = "white";
    }
}

// Main Application
class FantasyFootballApp {
    constructor() {
        this.state = new FantasyState();
        this.api = new AirtableService(CONFIG.API);
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

        document.querySelectorAll(".player").forEach(player => {
            const score = parseFloat(player.querySelector("input[data-field='score']").value) || 0;
            const team = player.parentElement.id.startsWith("ells") ? "ell" : "jack";
            scores[team] += score;
        });

        document.getElementById("jacks-score").textContent = scores.jack;
        document.getElementById("ells-score").textContent = scores.ell;
        document.getElementById("winner-display").textContent = 
            scores.ell > scores.jack ? "Ell" : 
            scores.jack > scores.ell ? "Jack" : "Draw";
    }

    async publishChanges() {
        if (this.state.unsavedChanges.length === 0) {
            alert("No changes to publish.");
            return;
        }

        try {
            const results = await Promise.all(
                this.state.unsavedChanges.map(change => this.api.publishChange(change))
            );
            
            console.log("Changes published:", results);
            alert("All changes published successfully!");
            this.state.clearChanges();
            this.updateScores();
        } catch (error) {
            console.error("Failed to publish changes:", error);
            alert("Error publishing changes. Please check your connection or contact support.");
        }
    }
}

// Initialize application
const app = new FantasyFootballApp();
