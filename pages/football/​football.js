let goalsScored = 0;

function shoot(direction) {
    const keeperDive = Math.floor(Math.random() * 3) + 1;
    const msgEl = document.getElementById('fbMsg');
    const goalsEl = document.getElementById('goals');
    
    if (direction === keeperDive) {
        msgEl.textContent = "Saved by the Goalkeeper! 🧤❌";
        msgEl.style.color = "#ff3333";
    } else {
        goalsScored++;
        goalsEl.textContent = goalsScored;
        msgEl.textContent = "GOAL!! Absolute screamer into the net! ⚽🔥";
        msgEl.style.color = "#4caf50";
    }
}
