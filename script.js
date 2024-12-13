// script.js
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
                key === "score" || key === "value" ? 
                    (value === '' ? '' : parseFloat(value)) : 
                    value
            ])
        );
    }
}

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
        let value = input.value.trim();
        
        if (value === '') {
            value = '';
        } else if (input.dataset.field === "score" || input.dataset.field === "value") {
            value = input.dataset.field === "value" ? 
                parseFloat(value.replace('£', '')) || 0 :
                parseFloat(value) || 0;
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
