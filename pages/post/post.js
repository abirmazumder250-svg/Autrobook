let mediaRecorder;
let audioChunks = [];
const recordBtn = document.getElementById('recordBtn');

if(recordBtn) {
    recordBtn.addEventListener('click', async () => {
        if(mediaRecorder && mediaRecorder.state === "recording") {
            mediaRecorder.stop();
            recordBtn.textContent = "🔴 Record Voice (30s)";
            return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
        mediaRecorder.onstop = () => {
            alert("Voice comment recorded successfully!");
        };
        mediaRecorder.start();
        recordBtn.textContent = "⏹️ Stop Recording";
    });
}
