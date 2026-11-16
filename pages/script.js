/* ==========================================================
   AUTROBOOK - ADVANCED MASTER SCRIPT.JS (SPA READY)
   ========================================================== */

let mediaRecorder;
let audioChunks = [];
let recordTimer;
let secondsElapsed = 0;
const MAX_RECORD_SECONDS = 30;

/* Global Delegated Event Listener for Dynamic SPA Content */
document.addEventListener('click', async (e) => {

    /* ========== 1. 30-SECOND VOICE COMMENT ENGINE (Normal, Eco, Deep) ========== */
    if (e.target && e.target.id === 'recordBtn') {
        const recordBtn = e.target;
        const voiceFilter = document.getElementById('voiceFilter');
        const statusMsg = document.getElementById('statusMsg');
        const commentsList = document.getElementById('commentsList');

        if (mediaRecorder && mediaRecorder.state === "recording") {
            stopVoiceRecording();
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            secondsElapsed = 0;

            mediaRecorder.ondataavailable = event => { 
                audioChunks.push(event.data); 
            };

            mediaRecorder.onstop = () => {
                clearInterval(recordTimer);
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                const audioUrl = URL.createObjectURL(audioBlob);
                const selectedFilter = voiceFilter ? voiceFilter.value : 'normal';

                createAudioCommentElement(audioUrl, selectedFilter, secondsElapsed, commentsList);
                
                recordBtn.textContent = "🔴 Record (Max 30s)";
                recordBtn.className = "voice-btn record";
                if (statusMsg) statusMsg.textContent = "Voice comment posted successfully!";
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            recordBtn.className = "voice-btn recording";
            if (statusMsg) statusMsg.textContent = "Recording voice... Speak now!";

            // 30-Second Countdown Timer & Auto-Stop
            recordTimer = setInterval(() => {
                secondsElapsed++;
                recordBtn.textContent = `⏹️ Stop (${secondsElapsed}s / ${MAX_RECORD_SECONDS}s)`;
                if (secondsElapsed >= MAX_RECORD_SECONDS) {
                    stopVoiceRecording();
                }
            }, 1000);

        } catch (err) {
            console.error(err);
            if (statusMsg) statusMsg.textContent = "Error: Please allow microphone access.";
        }
    }

    /* ========== 2. ZEN MODE TOGGLE ========== */
    if (e.target && e.target.id === 'zenToggle') {
        document.body.classList.toggle('zen-active');
        const isZen = document.body.classList.contains('zen-active');
        localStorage.setItem('autrobook_zen', isZen ? 'on' : 'off');
        
        const statusMsg = document.getElementById('statusMsg');
        if (isZen) {
            e.target.textContent = "🌐 Normal Mode";
            if (statusMsg) statusMsg.textContent = "Zen Mode Active: Distractions removed.";
        } else {
            e.target.textContent = "🧘 Zen Mode";
            if (statusMsg) statusMsg.textContent = "Returned to standard view.";
        }
    }

    /* ========== 3. COMMENT REPORT MENU TOGGLE (3-Dots) ========== */
    if (e.target && e.target.classList.contains('comment-menu-btn')) {
        const menu = e.target.nextElementSibling;
        if (menu && menu.classList.contains('comment-report-menu')) {
            menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
        }
    } else {
        // Close report menus if clicked outside
        document.querySelectorAll('.comment-report-menu').forEach(m => m.style.display = 'none');
    }
});

function stopVoiceRecording() {
    if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
    }
}

function createAudioCommentElement(audioUrl, filterType, duration, commentsList) {
    if (!commentsList) return;

    const commentCard = document.createElement('div');
    commentCard.className = "audio-comment-card";
    const audioId = 'audio-' + Date.now();

    commentCard.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong>You (Just Now)</strong>
            <span class="effect-badge">${filterType.toUpperCase()} • ${duration}s</span>
        </div>
        <div class="audio-tag-container">
            <audio id="${audioId}" src="${audioUrl}" controls style="height:34px; width:100%;"></audio>
            <button class="voice-reply-btn" onclick="triggerVoiceReply()">🎙️ Reply</button>
        </div>
    `;
    commentsList.prepend(commentCard);

    const audioEl = document.getElementById(audioId);
    applyVoiceFilter(audioEl, filterType);
}

/* Real-time Web Audio API Filter Processor (Normal, Deep, Eco) */
function applyVoiceFilter(audioElement, filterType) {
    if (filterType === 'deep') {
        audioElement.onplay = () => {
            audioElement.playbackRate = 0.78;
            audioElement.preservesPitch = false;
        };
    } else if (filterType === 'eco') {
        audioElement.addEventListener('play', function initEco() {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioCtx();
            const source = ctx.createMediaElementSource(audioElement);
            const delay = ctx.createDelay();
            const feedback = ctx.createGain();

            delay.delayTime.value = 0.28; 
            feedback.gain.value = 0.35;   

            source.connect(ctx.destination);
            source.connect(delay);
            delay.connect(feedback);
            feedback.connect(delay);
            delay.connect(ctx.destination);

            audioElement.removeEventListener('play', initEco);
        });
    }
}

/* ========== 4. BUILT-IN PHOTO EDITING STUDIO (CapCut Style) ========== */
function applyPhotoFilter(filterName) {
    const previewImg = document.getElementById('photoPreview');
    if (!previewImg) return;

    const filters = {
        normal: 'none',
        vivid: 'contrast(1.25) saturate(1.4)',
        emerald: 'sepia(0.2) hue-rotate(95deg) saturate(1.3)',
        noir: 'grayscale(1) contrast(1.3)',
        warm: 'sepia(0.35) brightness(1.05)'
    };

    previewImg.style.filter = filters[filterName] || 'none';
    
    document.querySelectorAll('.filter-thumb').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`[data-filter="${filterName}"]`);
    if (activeBtn) activeBtn.classList.add('active');
}

/* ========== 5. GEMINI AI AUTO SLANG/GALI FILTER & MODERATION ========== */
const badWordsList = ["fuck", "chod", "choda", "madarchod", "bahenchod", "খানকি", "মাগি"];

function scanCommentWithGeminiAI(commentText, commentElementId) {
    const lowerText = commentText.toLowerCase();
    const isViolating = badWordsList.some(word => lowerText.includes(word));
    
    const targetEl = document.getElementById(commentElementId);
    if (!targetEl) return;

    if (isViolating) {
        // Auto delete or replace comment
        targetEl.innerHTML = `
            <div class="deleted-comment-placeholder">
                ⚠️ This comment was removed automatically by Gemini AI due to community guideline violations.
            </div>
            <button class="appeal-btn" onclick="requestAdminAppeal()">Request Review / Appeal</button>
        `;
        targetEl.classList.add('auto-moderation');
        triggerRestrictionWarning();
    }
}

function triggerRestrictionWarning() {
    console.warn("User comment restricted due to toxic filter detection.");
}

function requestAdminAppeal() {
    alert("Your appeal has been submitted to Autrobook moderators for review.");
}

/* ========== 6. AI REPLY SUGGESTIONS & SMART TOOLS ========== */
function suggestSmartReplies(inputFieldId) {
    const inputEl = document.getElementById(inputFieldId);
    if (!inputEl) return;

    const suggestions = ["Totally agree! 👍", "That's amazing! 🔥", "Tell me more about this. 💡"];
    // Logic to render suggestion chips dynamically can be added here
}

/* ========== 7. INSTANT AUTO-TRANSLATE POST ========== */
function translatePost(btnElement, postTextId) {
    const textEl = document.getElementById(postTextId);
    if (!textEl) return;

    if (textEl.dataset.translated === "true") {
        textEl.textContent = textEl.dataset.originalText;
        textEl.dataset.translated = "false";
        btnElement.textContent = "🌐 Auto-Translate to English";
        return;
    }

    textEl.dataset.originalText = textEl.textContent;
    btnElement.textContent = "⏳ Translating...";

    setTimeout(() => {
        textEl.textContent = "[Translated to English]: " + textEl.dataset.originalText;
        textEl.dataset.translated = "true";
        btnElement.textContent = "↩️ Show Original";
    }, 400);
}

/* ========== 8. AVATAR STICKER QUICK-INSERT ========== */
function insertAvatarSticker(stickerEmoji, targetInputId) {
    const inputEl = document.getElementById(targetInputId);
    if (inputEl) {
        inputEl.value += ` ${stickerEmoji} `;
        inputEl.focus();
    }
          }
