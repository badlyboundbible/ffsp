// Constants and Utility Functions
const TEAM_COLORS = {
    ABD: "#e2001a",
    CEL: "#16973b",
    DUN: "#4f76ba",
    DDU: "#FF6601",
    HEA: "#800910",
    HIB: "#005000",
    KIL: "#534aeb",
    MOT: "#ffbe00",
    RAN: "#0000ff",
    ROS: "#040957",
    SJN: "#243f90",
    SMN: "#000000"
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

// State Management Class
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

// Airtable Service Class remains the same...

// PlayerComponent Class remains the same...

// FantasyFootballApp Class
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

    async refreshData() {
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
            loadingMsg.textContent = 'Refreshing...';
            document.body.appendChild(loadingMsg);

            const records = await this.api.fetchData();
            this.state.setRecords(records);
            this.displayPlayers(records);
            this.initializePowerups();
            
            document.body.removeChild(loadingMsg);
        } catch (error) {
            console.error("Failed to refresh data:", error);
            alert("Error refreshing data. Please check your connection or try again.");
        }
    }

    openCalculator() {
        const modal = document.getElementById('calculator-modal');
        modal.style.display = 'block';

        // Close button functionality
        const closeButton = modal.querySelector('.close-button');
        closeButton.onclick = () => {
            modal.style.display = 'none';
            this.resetCalculator();
        };

        // Close modal when clicking outside
        window.onclick = (event) => {
            if (event.target == modal) {
                modal.style.display = 'none';
                this.resetCalculator();
            }
        };

        // Initialize calculator functionality
        this.initializeCalculator();
    }

    resetCalculator() {
        const totalScoreDisplay = document.getElementById('total-score');
        
        // Reset total score
        totalScoreDisplay.textContent = '0';

        // Reset all buttons
        document.querySelectorAll('.calculator button').forEach(button => {
            if (!button.classList.contains('position-button') && 
                button.id !== 'calculate-button') {
                button.classList.remove('active');
            }
        });

        // Reset real-world value input
        document.getElementById('real-world-value').value = '';
        document.getElementById('ffs-value').textContent = '£0.0';

        // Deselect position buttons
        document.querySelectorAll('.position-button').forEach(btn => btn.classList.remove('active'));
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

        // Find penalty records
        const ellPenaltyRecord = this.state.records.find(r => r.fields.player_id === 'ell-powerups');
        const jackPenaltyRecord = this.state.records.find(r => r.fields.player_id === 'jack-powerups');

        // Get penalties
        if (ellPenaltyRecord && ellPenaltyRecord.fields.PEN) {
            penalties.ell = ellPenaltyRecord.fields.PEN;
        }
        if (jackPenaltyRecord && jackPenaltyRecord.fields.PEN) {
            penalties.jack = jackPenaltyRecord.fields.PEN;
        }

        document.querySelectorAll(".player").forEach(player => {
            const circle = player.querySelector(".position-circle");
            const scoreInput = player.querySelector("input[data-field='score']");
            const scoreValue = scoreInput.value.trim();
            const baseScore = scoreValue === '' ? 0 : (parseFloat(scoreValue) || 0);
            
            // Get multiplier based on state
            const state = circle.dataset.state;
            let multiplier = 1;
            if (state === 'captain') multiplier = 2;
            else if (state === 'vice-captain') multiplier = 1.5;
            else if (state === 'triple-captain') multiplier = 3;
            
            const finalScore = state === 'benched' ? 0 : (baseScore * multiplier);
            
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

        // Update display
        document.getElementById("jacks-score").textContent = Math.round(scores.jack);
        document.getElementById("ells-score").textContent = Math.round(scores.ell);
        
        const winnerDisplay = document.getElementById("winner-display");
        winnerDisplay.classList.remove("ell-winner", "jack-winner");

        if (scores.ell > scores.jack) {
            winnerDisplay.textContent = "Ell";
            winnerDisplay.classList.add("ell-winner");
        } else if (scores.jack > scores.ell) {
            winnerDisplay.textContent = "Jack";
            winnerDisplay.classList.add("jack-winner");
        } else {
            winnerDisplay.textContent = "Draw";
        }

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

    // Rest of the initializeCalculator method remains the same as in the previous script
    initializeCalculator() {
        // ... (the entire implementation remains the same as in the previous script)
    }
}

// Initialize application
const app = new FantasyFootballApp();
