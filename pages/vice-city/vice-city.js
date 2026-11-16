/* ==========================================================
   AUTROBOOK - VICE CITY STATIC RETRO HUB SCRIPT
   ========================================================== */

const quotes = [
    "I poke my head out of the gutter for one freakin' second and fate shovels shit in my face.",
    "People like us don't go to heaven, Ken.",
    "You know how it is. You try to go straight, they drag you back down.",
    "Keep your friends close, but your enemies closer, man."
];

function changeViceQuote() {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    document.getElementById('viceQuote').textContent = `"${quotes[randomIndex]}"`;
}

function postViceVibe() {
    const input = document.getElementById('viceInput');
    if (!input.value.trim()) {
        alert('Please write something first!');
        return;
    }
    alert(`Successfully broadcasted to Vice City Neon Network: "${input.value}" 🌴✨`);
    input.value = '';
}

console.log("Vice City Retro Hub initialized without external media dependency.");
