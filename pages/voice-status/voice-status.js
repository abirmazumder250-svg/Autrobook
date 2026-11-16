let isRecordingStatus = false;
function toggleVoiceStatusRecord() {
    const btn = document.getElementById('voiceStatusBtn');
    const timerText = document.getElementById('recordTimerStatus');
    
    isRecordingStatus = !isRecordingStatus;
    if(isRecordingStatus) {
        btn.style.background = "var(--danger-color, #ef4444)";
        timerText.textContent = "Recording... Speak now (0s / 30s)";
        timerText.style.color = "var(--danger-color, #ef4444)";
    } else {
        btn.style.background = "var(--brand-green)";
        timerText.textContent = "Voice status posted successfully! ✅";
        timerText.style.color = "var(--brand-green)";
    }
}
