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
            this.updateScores();
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

    applyPenalty(team, penaltyValue) {
        const penalty = parseInt(penaltyValue, 10) || 0;
        const recordId = team === 'ells' ? 'ell-powerups' : 'jack-powerups';

        this.state.addChange({
            id: recordId,
            fields: { PEN: penalty }
        });

        this.updateScores();
    }

    updateScores() {
        const penalties = {
            ells: parseInt(document.getElementById('ell-penalty').value, 10) || 0,
            jacks: parseInt(document.getElementById('jack-penalty').value, 10) || 0
        };

        let scores = { ells: 0, jacks: 0 };

        document.querySelectorAll(".player").forEach(player => {
            const scoreInput = player.querySelector("input[data-field='score']");
            const score = parseFloat(scoreInput.value) || 0;
            const roleButton = player.querySelector(".role-button");
            const role = roleButton ? roleButton.dataset.role : PLAYER_ROLES.NONE;
            const multiplier = ROLE_MULTIPLIERS[role] || 1;

            const team = player.parentElement.id.startsWith("ells") ? "ells" : "jacks";
            scores[team] += score * multiplier;
        });

        scores.ells += penalties.ells;
        scores.jacks += penalties.jacks;

        document.getElementById("ells-score").textContent = Math.round(scores.ells);
        document.getElementById("jacks-score").textContent = Math.round(scores.jacks);
        document.getElementById("winner-display").textContent =
            scores.ells > scores.jacks ? "Ell" :
            scores.jacks > scores.ells ? "Jack" : "Draw";
    }

    async publishChanges() {
        if (this.state.unsavedChanges.length === 0) {
            alert("No changes to publish.");
            return;
        }

        try {
            const results = [];
            for (const change of this.state.unsavedChanges) {
                const result = await this.api.publishChange(change);
                results.push(result);
            }
            alert("All changes published successfully!");
            this.state.clearChanges();
        } catch (error) {
            console.error("Error publishing changes:", error);
            alert("Error publishing changes.");
        }
    }
}

const app = new FantasyFootballApp();
