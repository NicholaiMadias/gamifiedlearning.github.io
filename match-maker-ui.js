// --- Updated within initLock() ---
function initLock() {
    const keypad = document.getElementById('lock-keypad');
    if (!keypad || keypad.children.length > 0) return; 
    
    // ... (keypad generation logic) ...
    
    // Ensure the execution button reflects the new branding
    const actionBtn = document.querySelector('#view-lock button');
    if (actionBtn) {
        actionBtn.innerText = "BREAK STATIC";
        actionBtn.classList.add('orbitron', 'tracking-[0.3em]');
    }
}

function handleLockInput(n) {
    lockInput += n;
    if (lockInput.length === 4) {
        if (lockInput === lockTarget) {
            score += 50;
            baseline = Math.max(0, baseline - 30); 
            
            // Visual feedback for "Breaking Static"
            updateStatus("STATIC BROKEN: Resonance Amplified.");
            
            resetLock();
            updateScoreDisplay();
        } else {
            updateStatus("INTERFERENCE DETECTED: Retry Sequence.");
            lockInput = "";
        }
    }
}
