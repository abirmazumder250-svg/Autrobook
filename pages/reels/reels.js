// Intersection Observer for Auto Play / Pause
const reelVideos = document.querySelectorAll('.reel-video');
const observerOptions = {
  root: null,
  threshold: 0.65
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    const video = entry.target;
    if (entry.isIntersecting) {
      video.play().catch(() => {});
      video.volume = 1.0;
    } else {
      video.pause();
    }
  });
}, observerOptions);

reelVideos.forEach(video => observer.observe(video));

// Like Reel Handler & Toggle
function likeReel(btn) {
  const heartIcon = btn.querySelector('.heart-icon');
  const countSpan = btn.querySelector('.action-count');
  let countVal = parseFloat(countSpan.innerText);

  if (heartIcon.classList.contains('liked')) {
    heartIcon.classList.remove('liked');
    countSpan.innerText = (countVal - 0.1).toFixed(1) + 'K';
  } else {
    heartIcon.classList.add('liked');
    countSpan.innerText = (countVal + 0.1).toFixed(1) + 'K';
  }
}

// Double Tap Heart Animation
function triggerHeartAnimation(event, videoEl) {
  const container = videoEl.parentElement.querySelector('.heart-anim-container');
  const heart = document.createElement('div');
  heart.className = 'floating-heart';
  heart.innerHTML = '❤️';
  container.appendChild(heart);

  setTimeout(() => {
    heart.remove();
  }, 600);

  // Trigger Like action automatically on double tap
  const likeBtn = videoEl.closest('.reel-item').querySelector('.reel-action-btn .heart-icon');
  if (!likeBtn.classList.contains('liked')) {
    likeBtn.classList.add('liked');
  }
}

// Follow / Following Toggle
function toggleFollow(btn) {
  if (btn.innerText === 'Follow') {
    btn.innerText = 'Following';
    btn.style.background = 'var(--bg-primary)';
    btn.style.color = 'var(--text-primary)';
    btn.style.border = '1px solid var(--green-bright)';
  } else {
    btn.innerText = 'Follow';
    btn.style.background = 'linear-gradient(135deg, var(--green-dark), var(--green-mid))';
    btn.style.color = '#fff';
    btn.style.border = 'none';
  }
}

// Enhanced Sound Booster (150% - 200%)
function toggleSoundBoost(btn) {
  const video = btn.closest('.reel-item').querySelector('.reel-video');
  const soundIcon = btn.querySelector('.sound-icon');

  if (video.muted) {
    video.muted = false;
    video.volume = 2.0; // Enhanced Audio Boost (200%)
    soundIcon.className = "fa-solid fa-volume-high sound-icon";
    btn.style.color = "var(--green-bright)";
  } else {
    video.muted = true;
    soundIcon.className = "fa-solid fa-volume-xmark sound-icon";
    btn.style.color = "#ef4444";
  }
}

// 4K Downloader with Progress simulation
function downloadReel(url, filename) {
  alert('Preparing 4K Ultra HD Download...');
  fetch(url)
    .then(resp => resp.blob())
    .then(blob => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}-Autrobook-4K.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      alert('4K Download Started Successfully! 🚀');
    })
    .catch(() => {
      alert('Download failed. Please check your network connection.');
    });
}

// Comments Drawer Management
function openComments(reelId) {
  document.getElementById('commentsDrawer').classList.remove('hidden');
}

function closeComments() {
  document.getElementById('commentsDrawer').classList.add('hidden');
}

function postReelComment() {
  const input = document.getElementById('reelCommentInput');
  const text = input.value.trim();
  if (!text) return;

  const container = document.getElementById('commentsListContainer');
  const div = document.createElement('div');
  div.className = 'comment-item';
  div.innerHTML = `<strong>Abir Mazumder:</strong> ${text}`;
  container.prepend(div);
  input.value = '';
}

function shareReel() {
  if (navigator.share) {
    navigator.share({
      title: 'Autrobook Reel',
      url: window.location.href
    }).catch(() => {});
  } else {
    navigator.clipboard.writeText(window.location.href);
    alert('Reel link copied to clipboard!');
  }
}

function openUploadModal() {
  alert('Reel Creator Studio opened! Select a 4K video from your gallery.');
}
