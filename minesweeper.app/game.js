document.addEventListener('DOMContentLoaded', () => {
    // Game constants
    const BOARD_SIZE = 10;
    const NUM_MINES = 12;

    // DOM Elements
    const boardElement = document.getElementById('game-board');
    const mineCountElement = document.getElementById('mine-count');
    const timerElement = document.getElementById('timer');
    const resetButton = document.getElementById('reset-button');

    // Game state variables
    let board = [];
    let mineLocations = [];
    let tilesRevealed = 0;
    let flagsPlaced = 0;
    let gameOver = false;
    let firstClick = true;
    let timerInterval;
    let time = 0;

    // --- Game Initialization ---

    function initGame() {
        // Reset state
        gameOver = false;
        firstClick = true;
        tilesRevealed = 0;
        flagsPlaced = 0;
        time = 0;
        board = [];
        mineLocations = [];
        resetButton.innerText = '🙂';

        // Setup UI
        updateMineCount();
        resetTimer();

        // Generate board
        boardElement.innerHTML = '';
        boardElement.style.gridTemplateColumns = `repeat(${BOARD_SIZE}, 1fr)`;
        boardElement.style.gridTemplateRows = `repeat(${BOARD_SIZE}, 1fr)`;

        for (let r = 0; r < BOARD_SIZE; r++) {
            const row = [];
            for (let c = 0; c < BOARD_SIZE; c++) {
                const tileObject = {
                    element: createTileElement(r, c),
                          r,
                          c,
                          isMine: false,
                          isRevealed: false,
                          isFlagged: false,
                          adjacentMines: 0,
                };
                row.push(tileObject);
                boardElement.appendChild(tileObject.element);
            }
            board.push(row);
        }
    }

    function createTileElement(r, c) {
        const tile = document.createElement('div');
        tile.classList.add('tile');
        tile.dataset.row = r;
        tile.dataset.col = c;
        tile.addEventListener('click', handleTileClick);
        tile.addEventListener('contextmenu', handleRightClick);
        return tile;
    }

    // --- Core Game Logic ---

    function placeMines(initialRow, initialCol) {
        let minesToPlace = NUM_MINES;
        while (minesToPlace > 0) {
            const r = Math.floor(Math.random() * BOARD_SIZE);
            const c = Math.floor(Math.random() * BOARD_SIZE);

            // Don't place a mine on the first clicked tile or if already a mine
            if ((r === initialRow && c === initialCol) || board[r][c].isMine) {
                continue;
            }

            board[r][c].isMine = true;
            mineLocations.push([r, c]);
            minesToPlace--;
        }
    }

    function calculateAdjacentMines() {
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (board[r][c].isMine) continue;
                let count = 0;
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        if (dr === 0 && dc === 0) continue;
                        const newRow = r + dr;
                        const newCol = c + dc;
                        if (isValid(newRow, newCol) && board[newRow][newCol].isMine) {
                            count++;
                        }
                    }
                }
                board[r][c].adjacentMines = count;
            }
        }
    }

    function revealTile(r, c) {
        if (!isValid(r, c) || board[r][c].isRevealed || board[r][c].isFlagged) return;

        const tile = board[r][c];
        tile.isRevealed = true;
        tile.element.classList.add('revealed');
        tilesRevealed++;

        if (tile.isMine) {
            endGame(false); // Player lost
            return;
        }

        if (tile.adjacentMines > 0) {
            tile.element.innerText = tile.adjacentMines;
            tile.element.classList.add(`c${tile.adjacentMines}`);
        } else {
            // If it's a blank tile, reveal neighbors
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    revealTile(r + dr, c + dc);
                }
            }
        }
    }

    // --- Event Handlers ---

    function handleTileClick(event) {
        if (gameOver) return;

        const tileElement = event.target;
        const r = parseInt(tileElement.dataset.row);
        const c = parseInt(tileElement.dataset.col);
        const tile = board[r][c];

        if (tile.isRevealed || tile.isFlagged) return;

        if (firstClick) {
            placeMines(r, c);
            calculateAdjacentMines();
            startTimer();
            firstClick = false;
        }

        revealTile(r, c);
        checkWinCondition();
    }

    function handleRightClick(event) {
        event.preventDefault();
        if (gameOver) return;

        const tileElement = event.target;
        const r = parseInt(tileElement.dataset.row);
        const c = parseInt(tileElement.dataset.col);
        const tile = board[r][c];

        if (tile.isRevealed) return;

        tile.isFlagged = !tile.isFlagged;
        if (tile.isFlagged) {
            tile.element.innerText = '🚩';
            tile.element.classList.add('flagged');
            flagsPlaced++;
        } else {
            tile.element.innerText = '';
            tile.element.classList.remove('flagged');
            flagsPlaced--;
        }
        updateMineCount();
    }

    // --- Game State Management ---

    function checkWinCondition() {
        if (tilesRevealed === (BOARD_SIZE * BOARD_SIZE) - NUM_MINES) {
            endGame(true);
        }
    }

    function endGame(isWin) {
        gameOver = true;
        stopTimer();

        mineLocations.forEach(([r, c]) => {
            const tile = board[r][c];
            tile.element.classList.add('revealed');
            if (!tile.isFlagged) {
                tile.element.innerText = '💣';
                tile.element.classList.add('mine');
            }
        });

        if (isWin) {
            resetButton.innerText = '😎';
        } else {
            resetButton.innerText = '😵';
            board.forEach(row => row.forEach(tile => {
                if (tile.isFlagged && !tile.isMine) {
                    tile.element.innerText = '❌';
                }
            }));
        }
    }

    // --- UI & Utility Functions ---

    function updateMineCount() {
        const minesLeft = NUM_MINES - flagsPlaced;
        mineCountElement.innerText = String(minesLeft).padStart(3, '0');
    }

    function startTimer() {
        timerInterval = setInterval(() => {
            time++;
            timerElement.innerText = String(time).padStart(3, '0');
        }, 1000);
    }

    function stopTimer() {
        clearInterval(timerInterval);
    }

    function resetTimer() {
        stopTimer();
        time = 0;
        timerElement.innerText = '000';
    }

    function isValid(r, c) {
        return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;
    }

    // --- Initial Setup ---
    resetButton.addEventListener('click', initGame);
    initGame();
});
