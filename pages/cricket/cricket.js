let totalScore = 0;
let remainingWickets = 3;

function hitBall() {
    const commentaryEl = document.getElementById('commentary');
    const scoreEl = document.getElementById('score');
    const wicketsEl = document.getElementById('wickets');
    
    const possibleOutcomes = [0, 1, 2, 4, 6, "OUT!"];
    const currentOutcome = possibleOutcomes[Math.floor(Math.random() * possibleOutcomes.length)];
    
    if (currentOutcome === "OUT!") {
        remainingWickets--;
        wicketsEl.textContent = remainingWickets;
        commentaryEl.textContent = "Oh no! Clean bowled! ❌";
        commentaryEl.style.color = "#ff3333";
        
        if (remainingWickets === 0) {
            alert(`Game Over! Final Score: ${totalScore}`);
            location.reload();
        }
    } else {
        totalScore += currentOutcome;
        scoreEl.textContent = totalScore;
        commentaryEl.style.color = "#4caf50";
        
        if (currentOutcome === 6) {
            commentaryEl.textContent = "Massive shot! That's a 6! 🔥";
        } else if (currentOutcome === 4) {
            commentaryEl.textContent = "Beautiful boundary! 4 runs. 🚀";
        } else {
            commentaryEl.textContent = `Good running! ${currentOutcome} run(s) taken.`;
        }
    }
}
