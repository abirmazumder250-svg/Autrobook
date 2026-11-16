/* ============================================================
   AUTROBOOK - GAMES HUB JAVASCRIPT
   ============================================================ */

// ===== 20 MOCK GAMES DATA =====
const gamesData = [
  // Action
  { id: 'g1', title: 'Vice City Real', category: 'action', icon: 'fa-city', cover: 'vice', file: 'games/vicecity.html' },
  { id: 'g2', title: 'Space Shooter', category: 'action', icon: 'fa-rocket', cover: 'shooter', file: 'games/space-shooter.html' },
  { id: 'g3', title: 'Zombie Survival', category: 'action', icon: 'fa-skull', cover: 'shooter', file: 'games/zombie-shooter.html' },
  { id: 'g4', title: 'Tower Defense', category: 'action', icon: 'fa-chess-rook', cover: 'vice', file: 'games/tower-defense.html' },
  
  // Sports
  { id: 'g5', title: 'Football Pro', category: 'sports', icon: 'fa-futbol', cover: 'football', file: 'games/football-penalty.html' },
  { id: 'g6', title: 'Cricket Blitz', category: 'sports', icon: 'fa-baseball-ball', cover: 'cricket', file: 'games/cricket-batting.html' },
  { id: 'g7', title: 'Basketball Hoops', category: 'sports', icon: 'fa-basketball-ball', cover: 'cricket', file: 'games/basketball.html' },
  { id: 'g8', title: 'Night Racing', category: 'sports', icon: 'fa-car', cover: 'racing', file: 'games/car-race.html' },

  // Arcade
  { id: 'g9', title: 'Classic Snake', category: 'arcade', icon: 'fa-staff-snake', cover: 'snake', file: 'games/snake.html' },
  { id: 'g10', title: 'Flappy Bird', category: 'arcade', icon: 'fa-dove', cover: 'snake', file: 'games/flappy.html' },
  { id: 'g11', title: 'Pong Retro', category: 'arcade', icon: 'fa-table-tennis', cover: 'tetris', file: 'games/pong.html' },
  { id: 'g12', title: 'Breakout Bricks', category: 'arcade', icon: 'fa-th', cover: 'ttt', file: 'games/breakout.html' },
  { id: 'g13', title: 'Platform Runner', category: 'arcade', icon: 'fa-running', cover: 'snake', file: 'games/platform-runner.html' },

  // Puzzle
  { id: 'g14', title: 'Tetris Blocks', category: 'puzzle', icon: 'fa-cubes', cover: 'tetris', file: 'games/tetris.html' },
  { id: 'g15', title: '2048 Numbers', category: 'puzzle', icon: 'fa-hashtag', cover: 'puzzle', file: 'games/2048.html' },
  { id: 'g16', title: 'Tic-Tac-Toe', category: 'puzzle', icon: 'fa-times', cover: 'ttt', file: 'games/tic-tac-toe.html' },
  { id: 'g17', title: 'Memory Match', category: 'puzzle', icon: 'fa-brain', cover: 'puzzle', file: 'games/memory-match.html' },
  { id: 'g18', title: 'Minesweeper', category: 'puzzle', icon: 'fa-bomb', cover: 'puzzle', file: 'games/minesweeper.html' },
  { id: 'g19', title: 'Sudoku Master', category: 'puzzle', icon: 'fa-table', cover: 'puzzle', file: 'games/sudoku.html' },
  { id: 'g20', title: 'Word Puzzle', category: 'puzzle', icon: 'fa-spell-check', cover: 'puzzle', file: 'games/word-puzzle.html' }
];

let currentCategory = 'all';

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  // Set dynamic year
  document.getElementById('dynamicYear').textContent = new Date().getFullYear();
  
  // Render initial games
  renderGames(gamesData);
});

// ===== RENDER GAMES =====
function renderGames(games) {
  const grid = document.getElementById('gamesGrid');
  
  if (games.length === 0) {
    grid.innerHTML = `<p style="text-align:center; color:var(--muted); grid-column:1/-1; margin-top:20px;">No games found.</p>`;
    return;
  }

  grid.innerHTML = games.map(game => `
    <div class="game-card" onclick="playGame('${game.file}', '${game.title}')">
      <div class="game-cover cover-${game.cover}">
        <i class="fas ${game.icon}"></i>
      </div>
      <div class="game-info">
        <div class="game-title">${game.title}</div>
        <div class="game-category">${game.category}</div>
        <button class="play-btn"><i class="fas fa-play"></i> Play Now</button>
      </div>
    </div>
  `).join('');
}

// ===== FILTERING =====
function filterCategory(category, btn) {
  currentCategory = category;
  
  // Update active tab
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  
  // Clear search
  document.getElementById('gameSearchInput').value = '';
  
  // Filter and render
  if (category === 'all') {
    renderGames(gamesData);
  } else {
    const filtered = gamesData.filter(g => g.category === category);
    renderGames(filtered);
  }
}

function filterGames() {
  const query = document.getElementById('gameSearchInput').value.toLowerCase();
  
  // Filter by both category and search query
  let filtered = gamesData;
  
  if (currentCategory !== 'all') {
    filtered = filtered.filter(g => g.category === currentCategory);
  }
  
  filtered = filtered.filter(g => g.title.toLowerCase().includes(query));
  
  renderGames(filtered);
}

// ===== PLAY GAME =====
function playGame(fileUrl, title) {
  document.getElementById('gamePlayerTitle').textContent = title;
  document.getElementById('gameIframe').src = fileUrl;
  document.getElementById('gamePlayerOverlay').classList.add('open');
}

function closeGame() {
  document.getElementById('gamePlayerOverlay').classList.remove('open');
  // Stop the game by clearing the iframe
  document.getElementById('gameIframe').src = '';
}
