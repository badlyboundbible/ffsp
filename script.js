// Constants and Helper Functions
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

// Main Application Class
class FantasyFootballApp {
    constructor() {
        this.state = new FantasyState();
        this.api = new AirtableService();
        this.init();
    }

    init() {
        document.addEventListener("DOMContentLoaded", () => {
            this.loadData();
            this.addGlobalEventListeners();
        });
    }

    addGlobalEventListeners() {
        // Publish Changes Button
        document.getElementById("publish-button").addEventListener("click", () => this.publishChanges());

        // Reset Buttons
        document.querySelectorAll(".reset-button").forEach(button => {
            const team = button.parentElement.querySelector("h2").textContent.includes("Ell") ? "ells" : "jacks";
            button.addEventListener("click", () => this.resetTeamScores(team));
        });
    }

    async loadData() {
        try {
            const records = await this.api.fetchData();
            this.state.setRecords(records);
            this.updatePlayers(records);
            this.initializePowerups();
        } catch (error) {
            console.error("Failed to load data:", error);
        }
    }

    updatePlayers(records) {
        records.forEach(record => {
            if (!record.fields?.player_id) return;

            const { player_id } = record.fields;
            const teamPrefix = player_id.startsWith("ell") ? "ells" : "jacks";
            const positionType = player_id.split("-")[1];
            const positionContainer = document.getElementById(`${teamPrefix}-${positionType}`);

            // Avoid full re-rendering by updating existing elements
            let playerElement = positionContainer.querySelector(`[data-id="${record.id}"]`);
            if (!playerElement) {
                const component = new PlayerComponent(record, this.state, () => this.updateScores());
                playerElement = component.createElements();
                positionContainer.appendChild(playerElement);
            }
        });

        this.updateScores();
    }

    updateScores() {
        const scores = { ell: 0, jack: 0 };
        const values = { ell: 0, jack: 0 };

        document.querySelectorAll(".player").forEach(player => {
            const scoreInput = player.querySelector("input[data-field='score']");
            const baseScore = parseFloat(scoreInput.value.trim() || 0);
            const roleButton = player.querySelector('.role-button');
            const role = roleButton ? roleButton.dataset.role : PLAYER_ROLES.NONE;
            const multiplier = ROLE_MULTIPLIERS[role] || 1;

            const finalScore = baseScore * multiplier;
            const valueInput = player.querySelector("input[data-field='value']");
            const value = parseFloat(valueInput.value.replace('£', '').trim() || 0);

            const team = player.parentElement.id.startsWith("ells") ? "ell" : "jack";
            scores[team] += finalScore;
            values[team] += value;
        });

        document.getElementById("jacks-score").textContent = Math.round(scores.jack);
        document.getElementById("ells-score").textContent = Math.round(scores.ell);
        document.getElementById("winner-display").textContent = scores.ell > scores.jack ? "Ell" : scores.jack > scores.ell ? "Jack" : "Draw";
        document.getElementById("jacks-value").textContent = `£${values.jack.toFixed(1)}`;
        document.getElementById("ells-value").textContent = `£${values.ell.toFixed(1)}`;
    }

    resetTeamScores(team) {
        document.querySelectorAll(`#${team}-gk, #${team}-def, #${team}-mid, #${team}-fwd input[data-field='score']`).forEach(input => {
            input.value = '';
            this.state.addChange({ id: input.dataset.id, fields: { score: null } });
        });
        this.updateScores();
    }

    async publishChanges() {
        // Implementation (unchanged)
    }
}

// Initialize Application
const app = new FantasyFootballApp();
