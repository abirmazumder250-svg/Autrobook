let currentReactionTarget = null;
let holdTimer = null;

// Initialize reactions for all action buttons
function initReactions() {
  const mainBtn = document.getElementById('mainLikeBtn');
  if (mainBtn) {
    // Mouse Hold Events
    mainBtn.addEventListener('mousedown', (e) => startHold(e, mainBtn));
    mainBtn.addEventListener('mouseup', cancelHold);
    mainBtn.addEventListener('mouseleave', cancelHold);
    
    // Touch Hold Events (Mobile friendly)
    mainBtn.addEventListener('touchstart', (e) => startHold(e, mainBtn));
    mainBtn.addEventListener('touchend', cancelHold);
    
    // Standard Click = Quick Like
    mainBtn.addEventListener('click', (e) => {
      if (!holdTimer) quickLike(mainBtn);
    });
  }
  
  // Reaction picker option clicks
  document.querySelectorAll('.reaction-btn').forEach(btn => {
    btn.addEventListener('click', (e) => selectReaction(e, btn));
  });
  
  // Close picker when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.reaction-picker') && !e.target.closest('#mainLikeBtn')) {
      hideReactionPicker();
    }
  });
}

function startHold(e, btn) {
  currentReactionTarget = btn;
  holdTimer = setTimeout(() => {
    showReactionPicker(btn);
    holdTimer = null;
  }, 450); // 450ms long press threshold
}

function cancelHold() {
  clearTimeout(holdTimer);
  holdTimer = null;
}

function showReactionPicker(btn) {
  const picker = document.getElementById('reactionPicker');
  const rect = btn.getBoundingClientRect();
  
  // Position picker right above the like button
  picker.style.left = `${rect.left - 20}px`;
  picker.style.top = `${rect.top - 65}px`;
  picker.classList.remove('hidden');
}

function hideReactionPicker() {
  document.getElementById('reactionPicker').classList.add('hidden');
  currentReactionTarget = null;
}

function selectReaction(e, btn) {
  e.stopPropagation();
  const reactionType = btn.dataset.reaction;
  
  if (currentReactionTarget) {
    setReactionUI(currentReactionTarget, reactionType);
  }
  hideReactionPicker();
}

function quickLike(btn) {
  const isReacted = btn.dataset.reacted === 'true';
  if (isReacted) {
    resetReaction(btn);
  } else {
    setReactionUI(btn, 'like');
  }
}

function setReactionUI(btn, reaction) {
  const reactionsMap = {
    like: { emoji: '👍', text: 'Like', color: 'var(--green-bright)' },
    love: { emoji: '❤️', text: 'Love', color: '#f33e58' },
    haha: { emoji: '😂', text: 'Haha', color: '#f7b125' },
    wow: { emoji: '😮', text: 'Wow', color: '#f7b125' },
    sad: { emoji: '😢', text: 'Sad', color: '#f7b125' },
    angry: { emoji: '😡', text: 'Angry', color: '#e9710f' }
  };
  
  const r = reactionsMap[reaction];
  btn.innerHTML = `<span>${r.emoji}</span> <span class="btn-text" style="color: ${r.color};">${r.text}</span>`;
  btn.style.color = r.color;
  btn.dataset.reacted = 'true';
  btn.classList.add('pop');
  
  setTimeout(() => btn.classList.remove('pop'), 300);

  // Update total reaction count simulation
  const countEl = document.getElementById('totalReactionCount');
  if (countEl) {
    countEl.innerText = '1.5K';
  }
}

function resetReaction(btn) {
  btn.innerHTML = `<i class="fa-regular fa-thumbs-up"></i> <span class="btn-text">Like</span>`;
  btn.style.color = 'var(--text-secondary)';
  btn.dataset.reacted = 'false';
}

// Auto Initialize on load
window.onload = () => {
  initReactions();
};
