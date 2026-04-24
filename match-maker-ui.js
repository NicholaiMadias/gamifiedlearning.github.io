/**
 * Nexus Arcade Engine v2.0 - Multi-Node Support
 */

const GRAPHICS_API = 'https://script.google.com/macros/s/AKfycbRML3cWX2MAAabhtW_fY0tixmfwfU7rFCxLj788SEl8lOl474T2wRbLzNQ9t1IhCJVUg/exec';
let score = 0, size = 8, gameAssets = [], board = [], selectedTile = null;
let lockTarget = "", lockInput = "", baseline = 0, lockInterval;
let statusTimeoutId = null;

// --- VIEW MANAGEMENT ---
function switchView(viewId) {
    if (statusTimeoutId) { clearTimeout(statusTimeoutId); statusTimeoutId = null; }
    
    document.querySelectorAll('[id^="view-"]').forEach(v => v.classList.add('hidden'));
    document.getElementById('hud').classList.add('hidden');
    
    const view = document.getElementById(viewId);
    if (view) view.classList.remove('hidden');
    if (viewId !== 'view-hub') document.getElementById('hud').classList.remove('hidden');
    
    if (viewId === 'view-match3') initMatch3();
    if (viewId === 'view-lock') initLock();
    if (viewId === 'view-hub' && lockInterval) clearInterval(lockInterval);
}

// --- MATCH-3 LOGIC (Starlight Seeker) ---
async function initMatch3() {
    try {
        const res = await fetch(GRAPHICS_API);
        const result = await res.json();
        gameAssets = result.data.filter(a => a.category === "Match3");
        createBoard(); 
        renderGrid();
    } catch (e) {
        console.error("Asset Sync Failed", e);
    }
}

// ... (Insert your createBoard, renderGrid, swapTiles, checkMatches logic here)

// --- LOCK PROTOCOL LOGIC (Number Lock) ---
function initLock() {
    const keypad = document.getElementById('lock-keypad');
    if (!keypad || keypad.children.length > 0) return; // Prevent double render
    
    for (let i = 1; i <= 9; i++) {
        const btn = document.createElement('button');
        btn.className = "key-btn h-14 rounded-xl text-xl font-bold flex items-center justify-center orbitron text-white";
        btn.innerText = i; 
        btn.onclick = () => handleLockInput(i.toString());
        keypad.appendChild(btn);
    }
    resetLock(); 
    if (lockInterval) clearInterval(lockInterval);
    lockInterval = setInterval(tickLock, 100);
}

function resetLock() {
    lockTarget = Math.floor(1000 + Math.random() * 9000).toString();
    document.getElementById('lock-target').innerText = lockTarget;
    lockInput = "";
    baseline = 0;
}

function handleLockInput(n) {
    lockInput += n;
    if (lockInput.length === 4) {
        if (lockInput === lockTarget) {
            score += 50;
            baseline = Math.max(0, baseline - 30); // Rewarding the player
            resetLock();
            updateScoreDisplay();
        }
        lockInput = "";
    }
}

function tickLock() {
    baseline += 0.5;
    const baselineEl = document.getElementById('baseline-pct');
    if (baselineEl) baselineEl.innerText = `BASELINE: ${Math.floor(baseline)}%`;
    
    if (baseline >= 100) {
        clearInterval(lockInterval);
        alert("Baseline Reached. System Rebooting.");
        switchView('view-hub');
    }
}

function updateScoreDisplay() {
    const scoreEl = document.getElementById('score-display');
    if (scoreEl) scoreEl.innerText = score;
}

window.onload = () => switchView('view-hub');
