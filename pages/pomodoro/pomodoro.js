let timeLeft = 1500; // 25 minutes
let timerInterval = null;

function startPomodoro() {
    if(timerInterval) return;
    timerInterval = setInterval(() => {
        if(timeLeft > 0) {
            timeLeft--;
            let mins = Math.floor(timeLeft / 60);
            let secs = timeLeft % 60;
            document.getElementById('timerDisplay').textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            clearInterval(timerInterval);
            alert("Pomodoro session completed! Take a 5 min break.");
        }
    }, 1000);
}

function resetPomodoro() {
    clearInterval(timerInterval);
    timerInterval = null;
    timeLeft = 1500;
    document.getElementById('timerDisplay').textContent = "25:00";
}
