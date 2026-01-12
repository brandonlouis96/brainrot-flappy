// Brain Rot Flappy Bird - Maximum Chaos Edition

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const deathMessage = document.getElementById('death-message');
const finalScore = document.getElementById('final-score');
const memePopupContainer = document.getElementById('meme-popup-container');
const gameContainer = document.getElementById('game-container');

// Base game dimensions (for scaling)
const BASE_WIDTH = 400;
const BASE_HEIGHT = 600;
let scale = 1;

// Resize canvas to fit screen while maintaining aspect ratio
function resizeCanvas() {
    const maxWidth = window.innerWidth;
    const maxHeight = window.innerHeight;

    // Calculate scale to fit screen
    const scaleX = maxWidth / BASE_WIDTH;
    const scaleY = maxHeight / BASE_HEIGHT;
    scale = Math.min(scaleX, scaleY, 1.5); // Cap at 1.5x to not get too big on desktop

    // Apply scaled dimensions
    canvas.width = BASE_WIDTH;
    canvas.height = BASE_HEIGHT;
    canvas.style.width = (BASE_WIDTH * scale) + 'px';
    canvas.style.height = (BASE_HEIGHT * scale) + 'px';
}

// Handle resize
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', () => {
    setTimeout(resizeCanvas, 100);
});

// Initial resize
resizeCanvas();

// Brain Rot Memes
const MEMES = [
    '6-7',
    'SKIBIDI',
    'SIGMA',
    'RIZZ',
    'GYATT',
    'FANUM TAX',
    'ONLY IN OHIO',
    'MEWING',
    'BUSSIN',
    'NO CAP',
    'SLAY',
    'SHEESH',
    'W',
    'L + RATIO',
    'GOATED',
    'FR FR',
    'ONG',
    'YEET'
];

const DEATH_MESSAGES = [
    'You lack sigma energy',
    'No rizz detected',
    'Ohio claimed another victim',
    'Skill issue (6/7)',
    'Fanum taxed your life',
    'Not bussin at all',
    'L + Ratio + No mewing',
    'Skibidi toilet flushed you',
    'Zero aura detected',
    'You forgot to mew'
];

const CHAOS_COLORS = [
    '#ff00ff', '#00ffff', '#ffff00', '#ff0000',
    '#00ff00', '#ff8800', '#8800ff', '#ff0088'
];

// Map themes
const MAPS = [
    {
        name: 'CLASSIC',
        skyTop: '#87CEEB',
        skyBottom: '#98FB98',
        ground: '#228B22',
        groundDirt: '#8B4513',
        pipeColor1: '#2ECC71',
        pipeColor2: '#27AE60',
        pipeColor3: '#1E8449',
        pipeStroke: '#145A32'
    },
    {
        name: 'NEON NIGHT',
        skyTop: '#0a0a1a',
        skyBottom: '#1a0a2e',
        ground: '#ff00ff',
        groundDirt: '#220022',
        pipeColor1: '#00ffff',
        pipeColor2: '#ff00ff',
        pipeColor3: '#0088ff',
        pipeStroke: '#ffffff'
    },
    {
        name: 'OHIO',
        skyTop: '#ff4444',
        skyBottom: '#ff8800',
        ground: '#444444',
        groundDirt: '#222222',
        pipeColor1: '#8B0000',
        pipeColor2: '#660000',
        pipeColor3: '#440000',
        pipeStroke: '#ffff00'
    }
];

let currentMapIndex = 0;
let currentMap = MAPS[0];

// Map selection functions
function nextMap() {
    currentMapIndex = (currentMapIndex + 1) % MAPS.length;
    currentMap = MAPS[currentMapIndex];
    updateMapDisplay();
}

function prevMap() {
    currentMapIndex = (currentMapIndex - 1 + MAPS.length) % MAPS.length;
    currentMap = MAPS[currentMapIndex];
    updateMapDisplay();
}

function updateMapDisplay() {
    const mapNameEl = document.getElementById('map-name');
    if (mapNameEl) {
        mapNameEl.textContent = currentMap.name;
    }
}

// Game state
let gameState = 'start'; // 'start', 'playing', 'gameover'
let score = 0;
let highScore = 0;

// Bird properties
const bird = {
    x: 80,
    y: 300,
    width: 40,
    height: 30,
    velocity: 0,
    gravity: 0.5,
    flapStrength: -9,
    rotation: 0
};

// Rainbow color cycling
let rainbowHue = 0;

// Pipe properties
let pipes = [];
const pipeWidth = 60;
const pipeGap = 150;
let pipeSpeed = 3;
const pipeSpawnInterval = 1800;
let lastPipeSpawn = 0;

// MONKEY MODE - activates at score 10
let monkeyMode = false;
let bullets = [];
let enemyBirds = [];
let lastEnemySpawn = 0;
const enemySpawnInterval = 1500;

// Audio context for sound effects
let audioContext;

// Custom sound effects
const harrySound = new Audio('sounds/67-harry.mp3');
harrySound.preload = 'auto';
let nextHarrySoundScore = 3; // Trigger every 3 pipes

const deathSound = new Audio('sounds/Fahhh.mp3');
deathSound.preload = 'auto';
deathSound.volume = 1.0; // Max volume for death sound
harrySound.volume = 1.0; // Max volume for 6-7 sound

// Background music
const bgMusic = new Audio('sounds/bgm.mp3');
bgMusic.preload = 'auto';
bgMusic.loop = true;
bgMusic.volume = 0.15; // Much lower BGM so sound effects stand out

// Monkey mode music
const monkeyBgm = new Audio('sounds/monkey-bgm.mp3');
monkeyBgm.preload = 'auto';
monkeyBgm.loop = true;
monkeyBgm.volume = 0.3;

// Play the 6-7 Harry sound
function playHarrySound() {
    harrySound.currentTime = 0;
    harrySound.play().catch(e => console.log('Audio play failed:', e));
}

// Play death sound
function playDeathSound() {
    bgMusic.pause(); // Pause BGM so death sound is clear
    monkeyBgm.pause(); // Also pause monkey BGM
    deathSound.currentTime = 0;
    deathSound.play().catch(e => console.log('Audio play failed:', e));
}

// Start background music
function startBgMusic() {
    bgMusic.play().catch(e => console.log('BGM play failed:', e));
}

// Initialize audio context on first interaction
function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Preload sounds for mobile (needs user interaction)
    harrySound.load();
    deathSound.load();
    bgMusic.load();
    monkeyBgm.load();

    // Start background music
    startBgMusic();
}

// Generate brain rot sound effects
function playSound(type) {
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    switch(type) {
        case 'flap':
            oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
            break;

        case 'score':
            // Chaotic score sound
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
            break;

        case 'death':
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.5);
            gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
            break;

        case 'chaos':
            // Random chaotic sound for maximum brain rot
            const freqs = [262, 330, 392, 523, 659, 784];
            oscillator.type = ['sine', 'square', 'sawtooth', 'triangle'][Math.floor(Math.random() * 4)];
            oscillator.frequency.setValueAtTime(freqs[Math.floor(Math.random() * freqs.length)], audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(freqs[Math.floor(Math.random() * freqs.length)], audioContext.currentTime + 0.15);
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.15);
            break;

        case 'shoot':
            // Gunshot sound
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
            break;
    }
}

// Get random meme
function getRandomMeme() {
    return MEMES[Math.floor(Math.random() * MEMES.length)];
}

// Get random death message
function getRandomDeathMessage() {
    return DEATH_MESSAGES[Math.floor(Math.random() * DEATH_MESSAGES.length)];
}

// Get random color
function getRandomColor() {
    return CHAOS_COLORS[Math.floor(Math.random() * CHAOS_COLORS.length)];
}

// Create meme popup
function createMemePopup(x, y, text, isLarge = false, isChaos = false) {
    const popup = document.createElement('div');
    popup.className = 'meme-popup' + (isLarge ? ' large' : '') + (isChaos ? ' chaos' : '');
    popup.textContent = text;
    popup.style.left = x + 'px';
    popup.style.top = y + 'px';
    popup.style.color = getRandomColor();
    memePopupContainer.appendChild(popup);

    setTimeout(() => popup.remove(), 1000);
}

// Create text explosion
function createTextExplosion(x, y) {
    const numParticles = Math.min(5 + Math.floor(score / 3), 15);

    for (let i = 0; i < numParticles; i++) {
        const particle = document.createElement('div');
        particle.className = 'text-explosion';
        particle.textContent = getRandomMeme();
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.color = getRandomColor();

        const angle = (Math.PI * 2 / numParticles) * i;
        const distance = 100 + Math.random() * 100;
        particle.style.setProperty('--tx', Math.cos(angle) * distance + 'px');
        particle.style.setProperty('--ty', Math.sin(angle) * distance + 'px');

        memePopupContainer.appendChild(particle);
        setTimeout(() => particle.remove(), 1000);
    }
}

// Screen shake effect
function triggerShake(intense = false) {
    gameContainer.classList.remove('shake', 'shake-intense');
    void gameContainer.offsetWidth; // Trigger reflow
    gameContainer.classList.add(intense ? 'shake-intense' : 'shake');
}

// Color flash effect
function triggerColorFlash() {
    const flash = document.createElement('div');
    flash.className = 'color-flash';
    flash.style.backgroundColor = getRandomColor();
    gameContainer.appendChild(flash);
    setTimeout(() => flash.remove(), 300);
}

// Chaos level based on score
function getChaosLevel() {
    if (score < 5) return 1;  // Mild
    if (score < 10) return 2; // Medium
    return 3; // MAXIMUM BRAIN ROT
}

// Trigger chaos events on score
function triggerChaosEvents() {
    const chaosLevel = getChaosLevel();

    // ACTIVATE MONKEY MODE at score 10!
    if (score === 10 && !monkeyMode) {
        monkeyMode = true;
        // Clear all pipes - no more flappy bird!
        pipes = [];
        // Put monkey on the ground
        bird.y = canvas.height - 100;
        bird.velocity = 0;
        // Switch to monkey mode music!
        bgMusic.pause();
        monkeyBgm.currentTime = 0;
        monkeyBgm.play().catch(e => {});
        createMemePopup(150, 150, 'MONKEY MODE!', true, true);
        createMemePopup(120, 250, 'SHOOT THE BIRDS!', true, true);
        triggerShake(true);
        for (let i = 0; i < 5; i++) {
            setTimeout(() => playSound('chaos'), i * 100);
        }
    }

    // Play Harry 6-7 sound every 3 pipes
    if (score >= nextHarrySoundScore) {
        playHarrySound();
        nextHarrySoundScore = score + 3; // Next trigger in 3 more pipes

        // Extra chaos when Harry sound plays
        createMemePopup(200, 250, '6-7', true, true);
        triggerShake(true);
    }

    // Always show meme popup
    createMemePopup(
        100 + Math.random() * 200,
        100 + Math.random() * 300,
        getRandomMeme(),
        chaosLevel >= 2,
        chaosLevel >= 3
    );

    // Play score sound
    playSound('score');

    if (chaosLevel >= 2) {
        // Screen shake
        triggerShake(chaosLevel >= 3);

        // Color flash
        triggerColorFlash();

        // Extra popup
        setTimeout(() => {
            createMemePopup(
                50 + Math.random() * 300,
                50 + Math.random() * 400,
                getRandomMeme(),
                false,
                true
            );
        }, 100);
    }

    if (chaosLevel >= 3) {
        // MAXIMUM BRAIN ROT
        createTextExplosion(bird.x, bird.y);

        // Multiple chaos sounds
        for (let i = 0; i < 3; i++) {
            setTimeout(() => playSound('chaos'), i * 50);
        }

        // More popups
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                createMemePopup(
                    Math.random() * 350,
                    Math.random() * 500,
                    getRandomMeme(),
                    Math.random() > 0.5,
                    true
                );
            }, i * 100);
        }

        // Speed up game slightly
        pipeSpeed = Math.min(3 + score * 0.05, 6);
    }
}

// Spawn a new pipe
function spawnPipe() {
    const minY = 100;
    const maxY = canvas.height - pipeGap - 100;
    const gapY = minY + Math.random() * (maxY - minY);

    pipes.push({
        x: canvas.width,
        gapY: gapY,
        scored: false,
        meme: getRandomMeme(),
        color: getRandomColor()
    });
}

// Reset game
function resetGame() {
    bird.y = 300;
    bird.velocity = 0;
    bird.rotation = 0;
    pipes = [];
    score = 0;
    pipeSpeed = 3;
    lastPipeSpawn = 0;
    scoreDisplay.textContent = '0';
    nextHarrySoundScore = 3; // Reset Harry sound trigger
    // Reset music to normal BGM
    monkeyBgm.pause();
    monkeyBgm.currentTime = 0;
    bgMusic.currentTime = 0;
    bgMusic.play().catch(e => {}); // Resume normal BGM on restart
    // Reset monkey mode
    monkeyMode = false;
    bullets = [];
    enemyBirds = [];
    lastEnemySpawn = 0;
}

// Flap the bird (or shoot in monkey mode)
function flap() {
    if (gameState === 'start') {
        initAudio();
        gameState = 'playing';
        startScreen.classList.add('hidden');
        resetGame();
        lastPipeSpawn = performance.now();
    } else if (gameState === 'playing') {
        if (monkeyMode) {
            // In monkey mode, just shoot - no flapping!
            shoot();
        } else {
            // Normal flappy bird mode
            bird.velocity = bird.flapStrength;
            playSound('flap');
        }
    } else if (gameState === 'gameover') {
        gameOverScreen.classList.add('hidden');
        gameState = 'playing';
        resetGame();
        lastPipeSpawn = performance.now();
    }
}

// Check collision
function checkCollision(pipe) {
    // Check if bird hits top pipe
    if (bird.x + bird.width > pipe.x && bird.x < pipe.x + pipeWidth) {
        if (bird.y < pipe.gapY || bird.y + bird.height > pipe.gapY + pipeGap) {
            return true;
        }
    }
    return false;
}

// Draw bird or MONKEY with gun!
function drawBird() {
    ctx.save();
    ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);

    // Rotate based on velocity
    bird.rotation = Math.min(Math.max(bird.velocity * 3, -30), 90);
    ctx.rotate(bird.rotation * Math.PI / 180);

    // Update rainbow hue
    rainbowHue = (rainbowHue + 3) % 360;

    if (monkeyMode) {
        // MONKEY ON GROUND WITH GUN POINTING UP!
        ctx.rotate(-bird.rotation * Math.PI / 180); // Cancel rotation for ground mode

        // Monkey body (brown) - bigger for ground mode
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(0, 10, 25, 30, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#5D2E0C';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Monkey head
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.arc(0, -25, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Monkey face (lighter brown)
        ctx.fillStyle = '#DEB887';
        ctx.beginPath();
        ctx.ellipse(0, -20, 14, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes (looking up!)
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(-6, -28, 6, 0, Math.PI * 2);
        ctx.arc(6, -28, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(-6, -30, 3, 0, Math.PI * 2);
        ctx.arc(6, -30, 3, 0, Math.PI * 2);
        ctx.fill();

        // Crazy grin
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -15, 8, 0.1 * Math.PI, 0.9 * Math.PI);
        ctx.stroke();

        // Ears
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.arc(-20, -25, 10, 0, Math.PI * 2);
        ctx.arc(20, -25, 10, 0, Math.PI * 2);
        ctx.fill();

        // Arms holding gun UP
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-8, -50, 6, 30);
        ctx.fillRect(2, -50, 6, 30);

        // GUN pointing UP!
        ctx.fillStyle = '#333';
        ctx.fillRect(-6, -85, 12, 35);
        ctx.fillStyle = '#666';
        ctx.fillRect(-8, -90, 16, 10);

        // Muzzle flash when shooting
        if (bullets.length > 0 && bullets[bullets.length - 1].age < 5) {
            ctx.fillStyle = '#ffff00';
            ctx.beginPath();
            ctx.arc(0, -100, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ff8800';
            ctx.beginPath();
            ctx.arc(0, -108, 8, 0, Math.PI * 2);
            ctx.fill();
        }
    } else {
        // Rainbow bird body
        ctx.fillStyle = `hsl(${rainbowHue}, 100%, 50%)`;
        ctx.beginPath();
        ctx.ellipse(0, 0, bird.width / 2, bird.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `hsl(${(rainbowHue + 180) % 360}, 100%, 40%)`;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Eye
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(8, -5, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(10, -5, 4, 0, Math.PI * 2);
        ctx.fill();

        // Beak (also rainbow)
        ctx.fillStyle = `hsl(${(rainbowHue + 60) % 360}, 100%, 50%)`;
        ctx.beginPath();
        ctx.moveTo(bird.width / 2 - 5, 0);
        ctx.lineTo(bird.width / 2 + 10, 0);
        ctx.lineTo(bird.width / 2 - 5, 8);
        ctx.closePath();
        ctx.fill();
    }

    ctx.restore();
}

// Shoot bullet (upward in shooter mode!)
function shoot() {
    if (!monkeyMode) return;
    bullets.push({
        x: bird.x + bird.width / 2,
        y: bird.y - 70, // Start from gun muzzle
        speedX: 0,
        speedY: -15, // Shoot upward fast!
        age: 0
    });
    playSound('shoot');
}

// Spawn enemy bird (from sky in shooter mode!)
function spawnEnemyBird() {
    const birdType = Math.random();

    if (birdType < 0.3) {
        // DIVER BIRD - comes from top and dives at monkey!
        enemyBirds.push({
            x: 50 + Math.random() * (canvas.width - 100),
            y: -50,
            speedX: (Math.random() - 0.5) * 2,
            speedY: 3 + Math.random() * 2, // Moves DOWN
            size: 35,
            hue: 0, // Red - danger!
            type: 'diver'
        });
    } else if (birdType < 0.5) {
        // BOMBER BIRD - targets the monkey directly!
        const targetX = bird.x + bird.width / 2;
        enemyBirds.push({
            x: targetX + (Math.random() - 0.5) * 100,
            y: -50,
            speedX: 0,
            speedY: 4 + Math.random() * 3, // Fast dive!
            size: 40,
            hue: 300, // Purple - extra danger!
            type: 'bomber'
        });
    } else {
        // Regular bird - flies across
        const fromLeft = Math.random() > 0.5;
        enemyBirds.push({
            x: fromLeft ? -50 : canvas.width + 50,
            y: 50 + Math.random() * 200,
            speedX: (3 + Math.random() * 3) * (fromLeft ? 1 : -1),
            speedY: 0,
            size: 30 + Math.random() * 15,
            hue: Math.random() * 360,
            type: 'normal'
        });
    }
}

// Draw enemy birds
function drawEnemyBirds() {
    enemyBirds.forEach(enemy => {
        ctx.save();
        ctx.translate(enemy.x, enemy.y);

        // Rotate divers/bombers to face downward
        if (enemy.type === 'diver' || enemy.type === 'bomber') {
            ctx.rotate(Math.PI / 2); // Face down
        }

        // Evil bird body
        ctx.fillStyle = `hsl(${enemy.hue}, 80%, ${enemy.type === 'bomber' ? 30 : 40}%)`;
        ctx.beginPath();
        ctx.ellipse(0, 0, enemy.size, enemy.size * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Danger outline for divers/bombers
        if (enemy.type === 'diver' || enemy.type === 'bomber') {
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        // Angry eyes
        ctx.fillStyle = enemy.type === 'bomber' ? '#ffff00' : 'red';
        ctx.beginPath();
        ctx.arc(-5, -3, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(-4, -3, 2, 0, Math.PI * 2);
        ctx.fill();

        // Evil beak
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.moveTo(-enemy.size + 5, 0);
        ctx.lineTo(-enemy.size - 10, 3);
        ctx.lineTo(-enemy.size + 5, 6);
        ctx.closePath();
        ctx.fill();

        // Warning symbol on bombers
        if (enemy.type === 'bomber') {
            ctx.fillStyle = '#ffff00';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('!', 0, 5);
        }

        ctx.restore();
    });
}

// Draw bullets (vertical for upward shooting)
function drawBullets() {
    bullets.forEach(bullet => {
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.ellipse(bullet.x, bullet.y, 4, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ff8800';
        ctx.beginPath();
        ctx.ellipse(bullet.x, bullet.y + 8, 3, 6, 0, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Update monkey mode entities
function updateMonkeyMode(timestamp) {
    if (!monkeyMode) return;

    // Calculate difficulty - spawns faster as score increases!
    const timeSinceMonkeyMode = score - 10;
    const spawnRate = Math.max(400, 1000 - timeSinceMonkeyMode * 30); // Gets faster!

    // Spawn enemy birds
    if (timestamp - lastEnemySpawn > spawnRate) {
        spawnEnemyBird();
        lastEnemySpawn = timestamp;
    }

    // Update bullets (shoot upward!)
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y += bullets[i].speedY;
        bullets[i].age++;
        // Remove if off screen (top)
        if (bullets[i].y < -20) {
            bullets.splice(i, 1);
        }
    }

    // Monkey hitbox for collision
    const monkeyX = bird.x + bird.width / 2;
    const monkeyY = bird.y;
    const monkeyRadius = 35;

    // Update enemy birds
    for (let i = enemyBirds.length - 1; i >= 0; i--) {
        const enemy = enemyBirds[i];

        // Move bird
        enemy.x += enemy.speedX || 0;
        enemy.y += enemy.speedY || 0;

        // CHECK IF BIRD HITS MONKEY - GAME OVER!
        const dx = enemy.x - monkeyX;
        const dy = enemy.y - monkeyY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < enemy.size + monkeyRadius) {
            // HIT! Game over!
            createMemePopup(enemy.x, enemy.y, 'SKILL ISSUE!', true, true);
            gameOver();
            return;
        }

        // Remove if off screen
        if (enemy.x < -100 || enemy.x > canvas.width + 100 || enemy.y > canvas.height + 50) {
            enemyBirds.splice(i, 1);
        }
    }

    // Check bullet-enemy collisions
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = enemyBirds.length - 1; j >= 0; j--) {
            const b = bullets[i];
            const e = enemyBirds[j];
            if (b && e) {
                const dx = b.x - e.x;
                const dy = b.y - e.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < e.size + 10) {
                    // Hit!
                    bullets.splice(i, 1);
                    enemyBirds.splice(j, 1);
                    score += 2; // Bonus points for kills
                    scoreDisplay.textContent = score;
                    createMemePopup(e.x, e.y, 'GOTTEM!', true, true);
                    triggerShake(false);
                    playSound('chaos');
                    break;
                }
            }
        }
    }

    // Draw everything
    drawBullets();
    drawEnemyBirds();
}

// Draw pipe with meme text
function drawPipe(pipe) {
    const gradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + pipeWidth, 0);
    gradient.addColorStop(0, currentMap.pipeColor1);
    gradient.addColorStop(0.5, currentMap.pipeColor2);
    gradient.addColorStop(1, currentMap.pipeColor3);

    // Top pipe
    ctx.fillStyle = gradient;
    ctx.fillRect(pipe.x, 0, pipeWidth, pipe.gapY);
    ctx.strokeStyle = currentMap.pipeStroke;
    ctx.lineWidth = 3;
    ctx.strokeRect(pipe.x, 0, pipeWidth, pipe.gapY);

    // Top pipe cap
    ctx.fillRect(pipe.x - 5, pipe.gapY - 30, pipeWidth + 10, 30);
    ctx.strokeRect(pipe.x - 5, pipe.gapY - 30, pipeWidth + 10, 30);

    // Bottom pipe
    ctx.fillStyle = gradient;
    ctx.fillRect(pipe.x, pipe.gapY + pipeGap, pipeWidth, canvas.height - pipe.gapY - pipeGap);
    ctx.strokeRect(pipe.x, pipe.gapY + pipeGap, pipeWidth, canvas.height - pipe.gapY - pipeGap);

    // Bottom pipe cap
    ctx.fillRect(pipe.x - 5, pipe.gapY + pipeGap, pipeWidth + 10, 30);
    ctx.strokeRect(pipe.x - 5, pipe.gapY + pipeGap, pipeWidth + 10, 30);

    // Meme text on pipe
    ctx.save();
    ctx.fillStyle = pipe.color;
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 4;

    // Text on top pipe
    if (pipe.gapY > 50) {
        ctx.fillText(pipe.meme, pipe.x + pipeWidth / 2, pipe.gapY - 45);
    }

    // Text on bottom pipe
    ctx.fillText(pipe.meme, pipe.x + pipeWidth / 2, pipe.gapY + pipeGap + 50);

    ctx.restore();
}

// Draw background
function drawBackground() {
    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, currentMap.skyTop);
    gradient.addColorStop(0.7, currentMap.skyBottom);
    gradient.addColorStop(1, currentMap.ground);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Ground
    ctx.fillStyle = currentMap.groundDirt;
    ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
    ctx.fillStyle = currentMap.ground;
    ctx.fillRect(0, canvas.height - 25, canvas.width, 5);

    // Chaos background effects at high scores
    if (getChaosLevel() >= 3 && Math.random() > 0.95) {
        ctx.fillStyle = getRandomColor() + '20';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

// Game loop
function gameLoop(timestamp) {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    drawBackground();

    if (gameState === 'playing') {
        if (monkeyMode) {
            // SHOOTER MODE - monkey on ground, shoot birds!
            bird.x = canvas.width / 2 - bird.width / 2; // Center monkey
            bird.y = canvas.height - 80; // Keep monkey on ground
            bird.velocity = 0;
            bird.rotation = 0;
            // No pipes in shooter mode!
        } else {
            // FLAPPY BIRD MODE
            // Update bird
            bird.velocity += bird.gravity;
            bird.y += bird.velocity;

            // Spawn pipes
            if (timestamp - lastPipeSpawn > pipeSpawnInterval / (1 + score * 0.02)) {
                spawnPipe();
                lastPipeSpawn = timestamp;
            }

            // Update and draw pipes
            for (let i = pipes.length - 1; i >= 0; i--) {
                const pipe = pipes[i];
                pipe.x -= pipeSpeed;

                // Check scoring
                if (!pipe.scored && pipe.x + pipeWidth < bird.x) {
                    pipe.scored = true;
                    score++;
                    scoreDisplay.textContent = score;
                    triggerChaosEvents();
                }

                // Check collision
                if (checkCollision(pipe)) {
                    gameOver();
                }

                // Remove off-screen pipes
                if (pipe.x + pipeWidth < 0) {
                    pipes.splice(i, 1);
                } else {
                    drawPipe(pipe);
                }
            }
        }

        // Update monkey mode (enemies, bullets, etc.)
        updateMonkeyMode(timestamp);

        // Check boundaries (only in flappy mode)
        if (!monkeyMode && (bird.y + bird.height > canvas.height - 20 || bird.y < 0)) {
            gameOver();
        }
    }

    // Draw bird
    drawBird();

    requestAnimationFrame(gameLoop);
}

// Game over
function gameOver() {
    gameState = 'gameover';
    playSound('death');
    playDeathSound();

    if (score > highScore) {
        highScore = score;
    }

    deathMessage.textContent = getRandomDeathMessage();
    finalScore.textContent = score;
    gameOverScreen.classList.remove('hidden');

    // Extra chaos on death
    triggerShake(true);
    createTextExplosion(bird.x, bird.y);
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            createMemePopup(
                Math.random() * 350,
                Math.random() * 500,
                getRandomMeme(),
                true,
                true
            );
            playSound('chaos');
        }, i * 100);
    }
}

// Event listeners
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        flap();
    }
});

canvas.addEventListener('click', flap);

// Mobile touch handling
document.addEventListener('touchstart', (e) => {
    e.preventDefault();
    flap();
}, { passive: false });

// Prevent default touch behaviors that interfere with game
document.addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });

document.addEventListener('touchend', (e) => {
    e.preventDefault();
}, { passive: false });

// Prevent context menu on long press
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

// Map selector buttons
document.getElementById('prev-map').addEventListener('click', (e) => {
    e.stopPropagation();
    prevMap();
});

document.getElementById('next-map').addEventListener('click', (e) => {
    e.stopPropagation();
    nextMap();
});

// Also handle touch for map buttons
document.getElementById('prev-map').addEventListener('touchstart', (e) => {
    e.stopPropagation();
    prevMap();
}, { passive: true });

document.getElementById('next-map').addEventListener('touchstart', (e) => {
    e.stopPropagation();
    nextMap();
}, { passive: true });

// Arrow keys for map selection on start screen
document.addEventListener('keydown', (e) => {
    if (gameState === 'start') {
        if (e.code === 'ArrowLeft') {
            prevMap();
        } else if (e.code === 'ArrowRight') {
            nextMap();
        }
    }
});

// Start game loop
requestAnimationFrame(gameLoop);
