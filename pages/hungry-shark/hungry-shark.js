let fishEatenCount = 0;
let sharkHealth = 100;

function eatFish() {
    const msgEl = document.getElementById('sharkMsg');
    const fishEl = document.getElementById('fishEaten');
    const healthEl = document.getElementById('health');
    
    const preyList = ["Small Fish (+10 HP)", "Colorful Coral Fish (+15 HP)", "Juicy Crab (+5 HP)"];
    const caughtPrey = preyList[Math.floor(Math.random() * preyList.length)];
    
    fishEatenCount++;
    sharkHealth = Math.min(100, sharkHealth + 10);
    
    fishEl.textContent = fishEatenCount;
    healthEl.textContent = sharkHealth;
    
    msgEl.textContent = `Chomp! Caught a ${caughtPrey} 🌊🦈`;
    msgEl.style.color = "#3b82f6";
}
