class FantasyFootballApp {
    constructor() {
        this.state = { ellScore: 0, jackScore: 0 };
        this.init();
    }

    init() {
        document.getElementById("publish-button").addEventListener("click", () => this.publishChanges());
        document.querySelector("#ells-team .reset-button").addEventListener("click", () => this.resetScores("ells"));
        document.querySelector("#jacks-team .reset-button").addEventListener("click", () => this.resetScores("jacks"));
        this.updateScores();
    }

    updateScores() {
        const ellScore = this.calculateTeamScore("ells");
        const jackScore = this.calculateTeamScore("jacks");

        this.state.ellScore = ellScore;
        this.state.jackScore = jackScore;

        document.getElementById("ells-score").textContent = ellScore;
        document.getElementById("jacks-score").textContent = jackScore;

        const winnerDisplay = document.getElementById("winner-display");
        winnerDisplay.textContent = ellScore > jackScore ? "Ell" : jackScore > ellScore ? "Jack" : "Draw";
    }

    calculateTeamScore(team) {
        const positions = ["gk", "def", "mid", "fwd"];
        let totalScore = 0;

        positions.forEach(position => {
            const input = document.getElementById(`${team}-${position}`);
            const score = parseInt(input.textContent || "0", 10);
            totalScore += score;
        });

        return totalScore;
    }

    resetScores(team) {
        const positions = ["gk", "def", "mid", "fwd"];
        positions.forEach(position => {
            const input = document.getElementById(`${team}-${position}`);
            input.textContent = "0";
        });

        this.updateScores();
    }

    publishChanges() {
        alert("Changes have been published!");
    }
}

document.addEventListener("DOMContentLoaded", () => new FantasyFootballApp());
