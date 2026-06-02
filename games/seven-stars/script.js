let score = 0;

// Map your uploaded filenames to CSS classes
const assetMap = ["star-gold", "star-blue", "star-purple", "star-red"];

function init() {
    const board = document.getElementById('match-board');
    for(let i=0; i<36; i++) {
        const sq = document.createElement('div');
        sq.className = 'square ' + assetMap[Math.floor(Math.random() * assetMap.length)];

        sq.onclick = function() {
            // Visual feedback using your Supernova asset
            this.classList.add('match-explode');

            score += 250;
            document.getElementById('score').innerText = score;

            setTimeout(() => {
                this.classList.remove('match-explode');
                // Logic to swap star type after "explosion"
                this.className = 'square ' + assetMap[Math.floor(Math.random() * assetMap.length)];
            }, 500);

            if(score >= 1000) {
                document.getElementById('solve-btn').style.display = 'inline-block';
                document.getElementById('msg').innerText = "BIOMETRICS DECRYPTED";
            }
        };
        board.appendChild(sq);
    }
}

window.addEventListener('DOMContentLoaded', init);
