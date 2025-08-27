document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('tetrorush-canvas');
    const context = canvas.getContext('2d');
    const nextPieceCanvas = document.getElementById('next-piece-canvas');
    const nextPieceContext = nextPieceCanvas.getContext('2d');
    const holdPieceCanvas = document.getElementById('hold-piece-canvas');
    const holdPieceContext = holdPieceCanvas.getContext('2d');

    // Game settings
    const GRID_SIZE = 35;
    const GAME_AREA_WIDTH_TILES = 10;
    const GAME_AREA_HEIGHT_TILES = 20;
    const GAME_AREA_WIDTH = GAME_AREA_WIDTH_TILES * GRID_SIZE;
    const GAME_AREA_HEIGHT = GAME_AREA_HEIGHT_TILES * GRID_SIZE;

    canvas.width = GAME_AREA_WIDTH;
    canvas.height = GAME_AREA_HEIGHT;
    nextPieceCanvas.width = 120;
    nextPieceCanvas.height = 120;
    holdPieceCanvas.width = 120;
    holdPieceCanvas.height = 120;


    const FPS = 60;
    const REPEAT_KEY_DELAY = 250;
    const REPEAT_KEY_INTERVAL = 50;

    // Colors
    const BLACK = '#0a0a0a';
    const WHITE = '#e6e6e6';
    const GREY = '#3c3c3c';
    const BORDER_COLOR = '#505050';
    const PAUSE_OVERLAY_COLOR = 'rgba(0, 0, 0, 0.7)';

    // Tetromino shapes and colors
    const SHAPES = [
        [[1, 1, 1, 1, 1]], // I
        [[1, 0, 0], [1, 1, 1]], // J
        [[0, 0, 1], [1, 1, 1]], // L
        [[1, 1], [1, 1]], // O
        [[0, 1, 1], [1, 1, 0]], // S
        [[1, 1, 0], [0, 1, 1]], // Z
        [[0, 1, 0], [1, 1, 1]] // T
    ];

    const SHAPE_COLORS = [
        '#00ffff', // Cyan (I)
'#0000ff', // Blue (J)
'#ffa500', // Orange (L)
'#ffff00', // Yellow (O)
'#00ff00', // Green (S)
'#ff0000', // Red (Z)
'#800080' // Purple (T)
    ];

    const HIGHSCORE_KEY = 'tetrorush_highscore';
    const VOLUME_KEY = 'tetrorush_volume';

    // --- Load sounds ---
    let sounds = {};
    const soundFiles = {
        "tetrorushmusic": "sounds/tetrorushmusic.wav",
        "start": "sounds/start.wav",
        "select": "sounds/select.wav",
        "rotate": "sounds/rotate.wav",
        "levelup": "sounds/levelup.wav",
        "lateralmove": "sounds/lateralmove.wav",
        "gameover": "sounds/gameover.wav",
        "drop": "sounds/drop.wav",
        "clear": "sounds/clear.wav",
        "hold": "sounds/select.wav",
        "pause": "sounds/select.wav",
        "pentaris": "sounds/tetrorush.wav"
    };

    Object.entries(soundFiles).forEach(([name, src]) => {
        sounds[name] = new Audio(src);
    });

    let currentPiece, nextPiece, heldPiece, canHold, gameBoard, gameOver, paused, score, level, linesClearedTotal, speed, highscore, soundVolume;

    let keyHeldTime = {};
    let keyLastActionTime = {};
    const repeatableKeys = ['ArrowLeft', 'ArrowRight', 'ArrowDown'];

    let lastFallTime = 0;
    let fallTimer = 0;
    let animationFrameId;
    let pieceBag = [];

    // UI Elements
    const scoreElement = document.getElementById('score');
    const highscoreElement = document.getElementById('highscore');
    const levelElement = document.getElementById('level');
    const linesElement = document.getElementById('lines');
    const volumeSlider = document.getElementById('volume-slider');
    const controlsButton = document.getElementById('controls-button');
    const modal = document.getElementById('controls-modal');
    const closeButton = document.querySelector('.close-button');

    // --- Utility Functions ---
    function playSound(name) {
        if (sounds[name]) {
            sounds[name].currentTime = 0;
            sounds[name].play();
        }
    }

    function setSoundVolume(volume) {
        soundVolume = Math.max(0.0, Math.min(1.0, volume));
        Object.values(sounds).forEach(sound => {
            sound.volume = soundVolume;
        });
        sounds.tetrorushmusic.volume = soundVolume * 0.7;
        localStorage.setItem(VOLUME_KEY, soundVolume);
    }

    function loadVolume() {
        const savedVolume = localStorage.getItem(VOLUME_KEY);
        soundVolume = savedVolume !== null ? parseFloat(savedVolume) : 0.3;
        volumeSlider.value = soundVolume;
        setSoundVolume(soundVolume);
    }

    function loadHighscore() {
        highscore = parseInt(localStorage.getItem(HIGHSCORE_KEY) || '0');
        highscoreElement.textContent = highscore;
    }

    function saveHighscore() {
        localStorage.setItem(HIGHSCORE_KEY, highscore);
    }

    function createPiece() {
        if (pieceBag.length === 0) {
            refillPieceBag();
        }
        const shapeIndex = pieceBag.pop(); // Take one piece from the end of the bag

        const shape = JSON.parse(JSON.stringify(SHAPES[shapeIndex]));
        const color = SHAPE_COLORS[shapeIndex];
        const startX = Math.floor(GAME_AREA_WIDTH_TILES / 2 - shape[0].length / 2);
        return { shape, color, x: startX, y: 0, index: shapeIndex };
    }

    function refillPieceBag() {
        const allPieceIndices = [0, 1, 2, 3, 4, 5, 6]; // Indices for SHAPES array
        // Fisher-Yates shuffle algorithm for true randomness
        for (let i = allPieceIndices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allPieceIndices[i], allPieceIndices[j]] = [allPieceIndices[j], allPieceIndices[i]];
        }
        pieceBag = allPieceIndices;
    }

    function drawGrid() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.strokeStyle = GREY;
        for (let x = 0; x <= GAME_AREA_WIDTH_TILES; x++) {
            context.beginPath();
            context.moveTo(x * GRID_SIZE, 0);
            context.lineTo(x * GRID_SIZE, GAME_AREA_HEIGHT);
            context.stroke();
        }
        for (let y = 0; y <= GAME_AREA_HEIGHT_TILES; y++) {
            context.beginPath();
            context.moveTo(0, y * GRID_SIZE);
            context.lineTo(GAME_AREA_WIDTH, y * GRID_SIZE);
            context.stroke();
        }

        for (let y = 0; y < GAME_AREA_HEIGHT_TILES; y++) {
            for (let x = 0; x < GAME_AREA_WIDTH_TILES; x++) {
                if (gameBoard[y][x]) {
                    context.fillStyle = gameBoard[y][x];
                    context.fillRect(x * GRID_SIZE + 1, y * GRID_SIZE + 1, GRID_SIZE - 2, GRID_SIZE - 2);
                }
            }
        }

        context.strokeStyle = BORDER_COLOR;
        context.lineWidth = 3;
        context.strokeRect(0, 0, GAME_AREA_WIDTH, GAME_AREA_HEIGHT);
        context.lineWidth = 1;

    }

    function drawPiece(piece, ctx, ghost = false) {
        if (!piece) return;

        const { shape, color, x, y } = piece;
        ctx.fillStyle = color;
        ctx.strokeStyle = `rgba(0,0,0,0.5)`;

        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const px = (x + col) * GRID_SIZE;
                    const py = (y + row) * GRID_SIZE;
                    if (ghost) {
                        ctx.strokeStyle = GREY;
                        ctx.lineWidth = 1;
                        ctx.strokeRect(px + 1, py + 1, GRID_SIZE - 2, GRID_SIZE - 2);
                    } else {
                        ctx.fillRect(px + 1, py + 1, GRID_SIZE - 2, GRID_SIZE - 2);
                        ctx.strokeRect(px + 1, py + 1, GRID_SIZE - 2, GRID_SIZE - 2);
                    }
                }
            }
        }
    }

    function drawGhostPiece(piece) {
        if (!piece) return;
        const ghost = JSON.parse(JSON.stringify(piece));
        while (!checkCollision(ghost)) {
            ghost.y++;
        }
        ghost.y--;

        if (ghost.y > piece.y) {
            drawPiece(ghost, context, true);
        }
    }

    function drawPreviewPiece(piece, ctx) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        if (!piece) return;

        const { shape, color } = piece;
        const previewGridSize = GRID_SIZE * 0.6;

        const shapeWidth = shape[0].length * previewGridSize;
        const shapeHeight = shape.length * previewGridSize;

        const startX = (ctx.canvas.width - shapeWidth) / 2;
        const startY = (ctx.canvas.height - shapeHeight) / 2;

        ctx.fillStyle = color;
        ctx.strokeStyle = `rgba(0,0,0,0.5)`;

        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    ctx.fillRect(startX + col * previewGridSize, startY + row * previewGridSize, previewGridSize -1, previewGridSize -1);
                    ctx.strokeRect(startX + col * previewGridSize, startY + row * previewGridSize, previewGridSize -1, previewGridSize -1);

                }
            }
        }
    }

    function checkCollision(piece, board = gameBoard) {
        const { shape, x, y } = piece;
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const boardX = x + col;
                    const boardY = y + row;

                    if (boardX < 0 || boardX >= GAME_AREA_WIDTH_TILES || boardY >= GAME_AREA_HEIGHT_TILES || (boardY >= 0 && board[boardY][boardX])) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    function rotatePiece(piece) {
        if (!piece) return;

        const originalShape = JSON.parse(JSON.stringify(piece.shape));
        const originalX = piece.x;

        const rotated = piece.shape[0].map((_, colIndex) => piece.shape.map(row => row[colIndex]).reverse());
        piece.shape = rotated;

        const kickOffsets = [0, 1, -1, 2, -2];
        for (const dx of kickOffsets) {
            piece.x = originalX + dx;
            if (!checkCollision(piece)) {
                playSound("rotate");
                return;
            }
        }
        piece.shape = originalShape;
        piece.x = originalX;
    }

    function placePiece(piece) {
        if (!piece) return;

        const { shape, color, x, y } = piece;

        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const boardX = x + col;
                    const boardY = y + row;
                    if (boardY < 0) {
                        gameOver = true;
                        return;
                    }
                    if (boardY < GAME_AREA_HEIGHT_TILES) {
                        gameBoard[boardY][boardX] = color;
                    }
                }
            }
        }
        playSound('select');

        clearLines();

        currentPiece = nextPiece;
        nextPiece = createPiece();
        canHold = true;

        if (checkCollision(currentPiece)) {
            gameOver = true;
        }
        updateUI();
    }

    function hardDropPiece(piece) {
        if (!piece) return;

        let distanceDropped = 0;
        const tempPiece = JSON.parse(JSON.stringify(piece));
        while (!checkCollision(tempPiece)) {
            tempPiece.y++;
            distanceDropped++;
        }
        tempPiece.y--;
        distanceDropped--;

        if (distanceDropped > 0) {
            score += distanceDropped * 2;
        }

        piece.y = tempPiece.y;
        playSound('drop');
        placePiece(piece);
    }

    function clearLines() {
        let linesToClear = [];
        for (let y = 0; y < GAME_AREA_HEIGHT_TILES; y++) {
            if (gameBoard[y].every(cell => cell)) {
                linesToClear.push(y);
            }
        }

        if (linesToClear.length > 0) {
            if(linesToClear.length === 5) playSound('pentaris');
            else playSound('clear');

            linesToClear.forEach(y => {
                gameBoard.splice(y, 1);
                gameBoard.unshift(new Array(GAME_AREA_WIDTH_TILES).fill(0));
            });

            linesClearedTotal += linesToClear.length;
            const lineScores = { 1: 100, 2: 300, 3: 500, 4: 800, 5: 1200 };
            score += lineScores[linesToClear.length] * level;

            const newLevel = Math.floor(linesClearedTotal / 10) + 1;
            if (newLevel > level) {
                level = newLevel;
                speed = Math.max(100, 750 - (level - 1) * 40);
                playSound('levelup');
            }
        }
    }

    function holdCurrentPiece() {
        if (!canHold) return;
        playSound('hold');
        canHold = false;

        const pieceToHold = JSON.parse(JSON.stringify(currentPiece));
        pieceToHold.shape = JSON.parse(JSON.stringify(SHAPES[pieceToHold.index]));
        pieceToHold.x = Math.floor(GAME_AREA_WIDTH_TILES / 2 - pieceToHold.shape[0].length / 2);
        pieceToHold.y = 0;

        if (heldPiece === null) {
            heldPiece = pieceToHold;
            currentPiece = nextPiece;
            nextPiece = createPiece();
        } else {
            const tempPiece = heldPiece;
            heldPiece = pieceToHold;
            currentPiece = tempPiece;
            currentPiece.x = Math.floor(GAME_AREA_WIDTH_TILES / 2 - currentPiece.shape[0].length / 2);
            currentPiece.y = 0;
        }

        if (checkCollision(currentPiece)) {
            gameOver = true;
        }
    }

    function drawGameOverScreen() {
        if (score > highscore) {
            highscore = score;
            saveHighscore();
        }
        sounds.tetrorushmusic.pause();
        playSound('gameover');

        context.fillStyle = PAUSE_OVERLAY_COLOR;
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.fillStyle = 'red';
        context.font = '36px Poppins';
        context.textAlign = 'center';
        context.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 80);

        context.fillStyle = WHITE;
        context.font = '24px Poppins';
        context.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 - 30);
        context.fillText(`High Score: ${highscore}`, canvas.width / 2, canvas.height / 2 + 10);

        context.font = '18px Poppins';
        context.fillText("Press 'R' to Restart", canvas.width / 2, canvas.height / 2 + 50);
        context.fillText("Press 'Esc' to Quit", canvas.width / 2, canvas.height / 2 + 80);
    }

    function drawPauseScreen() {
        context.fillStyle = PAUSE_OVERLAY_COLOR;
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.fillStyle = WHITE;
        context.font = '36px Poppins';
        context.textAlign = 'center';
        context.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    }

    function initializeGame() {
        pieceBag = [];
        refillPieceBag();

        loadHighscore();
        loadVolume();

        gameBoard = Array.from({ length: GAME_AREA_HEIGHT_TILES }, () => Array(GAME_AREA_WIDTH_TILES).fill(0));
        currentPiece = createPiece();
        nextPiece = createPiece();
        heldPiece = null;
        canHold = true;
        score = 0;
        level = 1;
        linesClearedTotal = 0;
        speed = 750;
        gameOver = false;
        paused = false;

        keyHeldTime = {};
        repeatableKeys.forEach(key => keyHeldTime[key] = 0);

        playSound('start');
        sounds.tetrorushmusic.currentTime = 0;
        sounds.tetrorushmusic.loop = true;
        sounds.tetrorushmusic.play();

        updateUI();
    }

    function updateUI() {
        scoreElement.textContent = score;
        highscoreElement.textContent = highscore;
        levelElement.textContent = level;
        linesElement.textContent = `Lines: ${linesClearedTotal}`;
        drawPreviewPiece(nextPiece, nextPieceContext);
        drawPreviewPiece(heldPiece, holdPieceContext);
    }

    function handleKeyDown(e) {
        if (e.key === 'Escape') {
            if (gameOver) {
                // Should quit game, but in browser context, maybe just stop the loop
                cancelAnimationFrame(animationFrameId);
                return;
            }
            paused = !paused;
            if (paused) {
                sounds.tetrorushmusic.pause();
                playSound('pause');
            } else {
                sounds.tetrorushmusic.play();
                lastFallTime = performance.now();
                gameLoop();
            }
        }

        if (gameOver) {
            if (e.key === 'r') {
                initializeGame();
                gameLoop();
            }
            return;
        }

        if (paused) return;

        if (repeatableKeys.includes(e.key) && !keyHeldTime[e.key]) {
            keyHeldTime[e.key] = performance.now();
            keyLastActionTime[e.key] = performance.now();
            handleMove(e.key);
        } else if (e.key === 'ArrowUp') {
            rotatePiece(currentPiece);
        } else if (e.key === ' ') {
            hardDropPiece(currentPiece);
        } else if (e.key === 'h') {
            holdCurrentPiece();
        } else if (e.key === 'r') {
            initializeGame();
        }
    }

    function handleKeyUp(e) {
        if (repeatableKeys.includes(e.key)) {
            keyHeldTime[e.key] = 0;
        }
    }

    function handleKeyRepeat() {
        const currentTime = performance.now();
        repeatableKeys.forEach(key => {
            if (keyHeldTime[key] > 0) {
                const timeHeld = currentTime - keyHeldTime[key];
                if (timeHeld > REPEAT_KEY_DELAY) {
                    const timeSinceLastAction = currentTime - keyLastActionTime[key];
                    if (timeSinceLastAction > REPEAT_KEY_INTERVAL) {
                        handleMove(key);
                        keyLastActionTime[key] = currentTime;
                    }
                }
            }
        });
    }

    function handleMove(key) {
        const tempPiece = JSON.parse(JSON.stringify(currentPiece));
        if (key === 'ArrowLeft') tempPiece.x--;
        if (key === 'ArrowRight') tempPiece.x++;
        if (key === 'ArrowDown') tempPiece.y++;

        if (!checkCollision(tempPiece)) {
            currentPiece.x = tempPiece.x;
            currentPiece.y = tempPiece.y;
            if (key === 'ArrowDown') fallTimer = 0;
            playSound('lateralmove');
        } else if (key === 'ArrowDown') {
            placePiece(currentPiece);
        }
    }

    function gameLoop(currentTime) {
        if (gameOver) {
            drawGameOverScreen();
            return;
        }
        if (paused) {
            drawPauseScreen();
            return;
        }

        handleKeyRepeat();

        if (!lastFallTime) lastFallTime = currentTime;
        const deltaTime = currentTime - lastFallTime;
        lastFallTime = currentTime;
        fallTimer += deltaTime;

        if (fallTimer > speed) {
            fallTimer = 0;
            const tempPiece = JSON.parse(JSON.stringify(currentPiece));
            tempPiece.y++;
            if (checkCollision(tempPiece)) {
                placePiece(currentPiece);
            } else {
                currentPiece.y++;
            }
        }

        drawGrid();
        drawGhostPiece(currentPiece);
        drawPiece(currentPiece, context);

        animationFrameId = requestAnimationFrame(gameLoop);
    }

    // Event Listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    volumeSlider.addEventListener('input', (e) => setSoundVolume(parseFloat(e.target.value)));
    controlsButton.addEventListener('click', () => modal.style.display = 'block');
    closeButton.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target == modal) {
            modal.style.display = 'none';
        }
    });

    // Start Game
    const startScreen = document.getElementById('start-screen-overlay');
    const startButton = document.getElementById('start-button');

    startButton.addEventListener('click', () => {
        startScreen.style.display = 'none';
        initializeGame();
        gameLoop();
    });
});
