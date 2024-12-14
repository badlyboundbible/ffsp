// Constants for team colors and multipliers
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

// Main Fantasy Football App
class FantasyFootballApp {
    constructor() {
        this.state = { records: [], unsavedChanges: [] };
        this.init();
    }

    init() {
        document.addEventListener("DOMContentLoaded", () => {
            this.loadData();
            this.addEventListeners();
        });
    }

    addEventListeners() {
        document.getElementById("publish-button").addEventListener("click", () => this.publishChanges());

        document.querySelectorAll(".reset-button").forEach(button => {
            const team = button.parentElement.querySelector("h2").textContent.includes("Ell") ? "ells" : "jacks";
            button.addEventListener("click", () => this.resetScores(team));
        });
    }

    async loadData() {
        // Simulate fetching data
        this.state.records = []; // Replace with real API fetch logic
        this.updatePlayers();
    }

    updatePlayers() {
        const records = this.state.records;
        ["ells", "jacks"].forEach(team => {
            ["gk", "def", "mid", "fwd"].forEach(position => {
                document.getElementById(`${team}-${position}`).innerHTML = "";
            });
        });

        records.forEach(record => {
            const playerElement = document.createElement("div");
            playerElement.textContent = `Player ${record.id}`; // Simplified
            document.getElementById(record.position).appendChild(playerElement);
        });

        this.updateScores();
    }

    updateScores() {
        const scores = { ells: 0, jacks: 0 };
        document.getElementById("ells-score").textContent = scores.ells;
        document.getElementById("jacks-score").textContent = scores.jacks;
        document.getElementById("winner-display").textContent = scores.ells > scores.jacks ? "Ell" : "Jack";
    }

    resetScores(team) {
        document.querySelectorAll(`#${team}-gk input, #${team}-def input, #${team}-mid input, #${team}-fwd input`).forEach(input => {
            input.value = "";
        });
        this.updateScores();
    }

    publishChanges() {
        alert("Changes published!"); // Simplified
    }
}

// Initialize App
new FantasyFootballApp();
