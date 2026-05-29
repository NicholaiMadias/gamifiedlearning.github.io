import React, { useEffect, useRef, useState } from 'react';
import { ShieldAlert, Trophy, Loader2 } from 'lucide-react';

export default function RelicRunner({ onExit, certEconomy, updateCert }) {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('playing'); // playing, completed, gameover
  const [score, setScore] = useState(0);
  const [room, setRoom] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // --- GAME STATE ---
    const player = { x: 50, y: 150, size: 20, speed: 4, color: '#00e5ff' }; // Neon Blue (Ella)
    const goal = { x: 700, y: 150, size: 30, color: '#fde047' }; // Yellow Relic/Door
    let enemies = [];
    
    // Key tracking
    const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };
    
    const handleKeyDown = (e) => { if (keys.hasOwnProperty(e.key)) keys[e.key] = true; };
    const handleKeyUp = (e) => { if (keys.hasOwnProperty(e.key)) keys[e.key] = false; };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Initialize Room
    const initRoom = (roomIndex) => {
      player.x = 50;
      player.y = canvas.height / 2;
      goal.x = canvas.width - 60;
      goal.y = canvas.height / 2;
      
      // Spawn Gloom enemies based on room level
      enemies = [];
      for (let i = 0; i < roomIndex * 2; i++) {
        enemies.push({
          x: 200 + Math.random() * (canvas.width - 300),
          y: Math.random() * canvas.height,
          size: 15 + Math.random() * 15,
          speed: 1 + Math.random() * 2,
          dirY: Math.random() > 0.5 ? 1 : -1,
          color: '#ef4444' // Red Queen Gloom
        });
      }
    };

    initRoom(room);

    // --- RENDER LOOP ---
    const render = () => {
      if (gameState !== 'playing') return;

      // Clear Canvas (Deep Space Black)
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Grid (Ministry Aesthetic)
      ctx.strokeStyle = '#7851A940'; // Royal Purple transparent
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 40) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
      }
      for (let i = 0; i < canvas.height; i += 40) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
      }

      // Update Player
      if (keys.ArrowUp && player.y > 0) player.y -= player.speed;
      if (keys.ArrowDown && player.y < canvas.height - player.size) player.y += player.speed;
      if (keys.ArrowLeft && player.x > 0) player.x -= player.speed;
      if (keys.ArrowRight && player.x < canvas.width - player.size) player.x += player.speed;

      // Draw Goal (Relic/Exit)
      ctx.shadowBlur = 15;
      ctx.shadowColor = goal.color;
      ctx.fillStyle = goal.color;
      ctx.fillRect(goal.x, goal.y, goal.size, goal.size);

      // Draw Player
      ctx.shadowColor = player.color;
      ctx.fillStyle = player.color;
      ctx.fillRect(player.x, player.y, player.size, player.size);
      ctx.shadowBlur = 0; // Reset for enemies

      // Update & Draw Enemies
      ctx.fillStyle = '#7f1d1d'; // Dark Red
      for (let enemy of enemies) {
        enemy.y += enemy.speed * enemy.dirY;
        if (enemy.y <= 0 || enemy.y >= canvas.height - enemy.size) enemy.dirY *= -1;
        ctx.fillRect(enemy.x, enemy.y, enemy.size, enemy.size);

        // Collision Detection (Gloom)
        if (
          player.x < enemy.x + enemy.size &&
          player.x + player.size > enemy.x &&
          player.y < enemy.y + enemy.size &&
          player.y + player.size > enemy.y
        ) {
          setGameState('gameover');
        }
      }

      // Collision Detection (Goal)
      if (
        player.x < goal.x + goal.size &&
        player.x + player.size > goal.x &&
        player.y < goal.y + goal.size &&
        player.y + player.size > goal.y
      ) {
        if (room >= 8) {
          setScore(prev => prev + 1000);
          setGameState('completed');
        } else {
          setScore(prev => prev + (room * 100));
          setRoom(prev => prev + 1);
          initRoom(room + 1);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, [room, gameState]);

  // --- MOCK FIREBASE SYNC ---
  const handleComplete = async () => {
    setSaving(true);
    
    // 1. Give the player their CERT rewards
    if (updateCert) {
      await updateCert({ R: 50, C: 100 }); // Reward for finishing the dungeon
    }

    // 2. Here is where your Apps Script / Firebase call goes using the secure tokens
    /*
      await fetch('YOUR_APPS_SCRIPT_WEB_APP_URL', {
         method: 'POST',
         body: JSON.stringify({ action: 'saveScore', gameId: 'relic_runner', score: score })
      });
    */
    
    setTimeout(() => {
      setSaving(false);
      onExit();
    }, 1500); // Simulate network delay
  };

  return (
    <div className="w-full max-w-4xl p-2 bg-[#0a0a0f] border border-cyan-900 rounded-xl shadow-[0_0_30px_rgba(0,229,255,0.15)] flex flex-col items-center">
      
      {/* GAME HUD */}
      <div className="w-full flex justify-between items-center p-4 border-b border-purple-900/50">
        <div>
          <h2 className="text-xl font-bold tracking-widest text-cyan-300">RELIC RUNNER</h2>
          <p className="text-xs text-purple-400">Dungeon Room: {room}/8</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 tracking-widest">LUMEN SCORE</p>
          <p className="text-2xl font-black text-yellow-400">{score}</p>
        </div>
      </div>

      {/* CANVAS CONTAINER */}
      <div className="relative w-full h-[400px] bg-black overflow-hidden my-4 border-2 border-purple-900 rounded-lg">
        {gameState === 'playing' && (
          <canvas 
            ref={canvasRef} 
            width={800} 
            height={400} 
            className="w-full h-full object-cover touch-none"
          />
        )}

        {/* OVERLAYS */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/90 backdrop-blur-sm">
            <ShieldAlert className="w-16 h-16 text-red-400 mb-4 animate-bounce" />
            <h2 className="text-3xl font-black tracking-widest text-white mb-2">GLOOM OVERTAKEN</h2>
            <p className="text-red-200 mb-6">Ella's integrity was compromised.</p>
            <button onClick={onExit} className="px-6 py-2 bg-black border border-red-500 text-red-500 hover:bg-red-500 hover:text-black font-bold tracking-widest transition-colors">
              RETURN TO MATRIX
            </button>
          </div>
        )}

        {gameState === 'completed' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-cyan-900/90 backdrop-blur-sm">
            <Trophy className="w-16 h-16 text-yellow-400 mb-4 drop-shadow-[0_0_15px_rgba(253,224,71,1)]" />
            <h2 className="text-3xl font-black tracking-widest text-white mb-2">RELIC RECOVERED</h2>
            <p className="text-cyan-200 mb-6">Final Score: {score} Lumen</p>
            
            <button 
              onClick={handleComplete}
              disabled={saving}
              className="px-6 py-2 bg-black border border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black font-bold tracking-widest transition-colors flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {saving ? 'SYNCING TO LEADERBOARD...' : 'CLAIM REWARD & EXIT'}
            </button>
          </div>
        )}
      </div>

      {/* CONTROLS (For mobile/touch context) */}
      <div className="w-full p-2 text-center text-xs text-gray-500">
        <p>Use WASD or Arrow Keys to navigate Ella (Blue) to the Relic (Yellow). Avoid the Gloom (Red).</p>
      </div>

    </div>
  );
}
