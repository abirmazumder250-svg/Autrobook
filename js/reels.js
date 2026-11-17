.reels-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  background: #000;
  height: calc(100vh - 56px);
  width: 100%;
}

.reels-container {
  width: 100%;
  max-width: 420px;
  height: 100%;
  position: relative;
  background: #111;
  overflow-y: scroll;
  scroll-snap-type: y mandatory;
  scrollbar-width: none;
  box-shadow: 0 4px 24px rgba(0,0,0,0.6);
}

.reels-container::-webkit-scrollbar {
  display: none;
}

.reel-viewport {
  width: 100%;
  height: 100%;
  scroll-snap-align: start;
  scroll-snap-stop: always;
  position: relative;
  flex-shrink: 0;
}

.reel-video-container {
  width: 100%;
  height: 100%;
  background: #000;
  position: relative;
}

.reel-video-container video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ai-badge-indicator {
  position: absolute;
  top: 16px;
  left: 16px;
  background: rgba(11, 93, 59, 0.85);
  border: 1px solid #2ecc71;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  color: #fff;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 6px;
}

.reel-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24px 70px 24px 20px;
  background: linear-gradient(transparent, rgba(0,0,0,0.95));
  color: #fff;
  z-index: 10;
  pointer-events: none;
}

.reel-profile, .views-hud-tag, .reel-caption {
  pointer-events: auto;
}

.reel-profile {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.reel-username {
  font-weight: 600;
  font-size: 15px;
}

.follow-btn {
  background: #0b5d3b;
  color: #fff;
  border: none;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
}

.follow-btn.following {
  background: rgba(255, 255, 255, 0.2);
  color: #e4e6eb;
}

.reel-caption {
  font-size: 14px;
  line-height: 1.4;
  opacity: 0.95;
}

.views-hud-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(0,0,0,0.4);
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
  margin-top: 8px;
  color: #fff;
}

.reel-actions-sidebar {
  position: absolute;
  right: 16px;
  bottom: 40px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  z-index: 20;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #fff;
  cursor: pointer;
}

.action-item button {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(0,0,0,0.65);
  border: 1px solid rgba(255,255,255,0.1);
  color: #fff;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.action-item button:hover {
  transform: scale(1.1);
  background: #0b5d3b;
}

.action-item span {
  font-size: 12px;
  margin-top: 6px;
  font-weight: 600;
}

.enhance-menu-section {
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 14px;
  margin-bottom: 14px;
}

.enhance-menu-section h4 {
  font-size: 14px;
  color: #0b5d3b;
  margin-bottom: 10px;
}

.enhance-control-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 600;
}

.enhance-control-row select {
  padding: 4px 8px;
  border-radius: 4px;
  background: var(--bg-main);
  border: 1px solid var(--border-color);
  color: var(--text-dark);
}

.switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 24px;
}

.switch input { opacity: 0; width: 0; height: 0; }

.slider {
  position: absolute;
  cursor: pointer;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: #ccc;
  transition: .3s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px; width: 16px;
  left: 4px; bottom: 4px;
  background-color: white;
  transition: .3s;
  border-radius: 50%;
}

input:checked + .slider { background-color: #0b5d3b; }
input:checked + .slider:before { transform: translateX(16px); }

.modal-actions-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.menu-action-row {
  width: 100%;
  padding: 12px 16px;
  background: var(--bg-main);
  border: none;
  border-radius: 6px;
  text-align: left;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-dark);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
}

.menu-action-row:hover { background: var(--bg-hover); }
.menu-action-row.danger { color: var(--error); }
