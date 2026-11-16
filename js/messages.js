/* ===== AI TYPING INDICATOR ===== */
.typing-indicator {
  width: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.fa-fade {
  animation: fade 1.5s infinite;
}
@keyframes fade {
  0% { opacity: 0.3; }
  50% { opacity: 1; }
  100% { opacity: 0.3; }
}
