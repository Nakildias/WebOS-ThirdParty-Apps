const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const WIDTH = 288;
const HEIGHT = 512;

// --- Framerate Limiting ---
let lastTime = 0;
const FPS = 60;
const frameInterval = 1000 / FPS;
// -------------------------

// Load images
const birdImages = [new Image(), new Image(), new Image()];
birdImages[0].src = 'blackbird-upflap.png';
birdImages[1].src = 'blackbird-midflap.png';
birdImages[2].src = 'blackbird-downflap.png';

const pipeImage = new Image();
pipeImage.src = 'pipe-green.png';

const baseImage = new Image();
baseImage.src = 'base.png';

const backgroundImage = new Image();
backgroundImage.src = 'background-day.png';

const gameOverImage = new Image();
gameOverImage.src = 'gameover.png';

const messageImage = new Image();
messageImage.src = 'message.png';

const highscoreImage = new Image();
highscoreImage.src = 'highscore.png';

const numberImages = [];
for (let i = 0; i < 10; i++) {
    numberImages[i] = new Image();
    numberImages[i].src = `${i}.png`;
}

// Load sounds
const wingSounds = [new Audio('wingflap1.wav'), new Audio('wingflap2.wav'), new Audio('wingflap3.wav'), new Audio('wingflap4.wav')];
const hitSound = new Audio('hit.wav');
const pointSound = new Audio('point.wav');
const gameoverSound = new Audio('gameover.wav');


// Game variables
let bird_x = 50;
let bird_y = HEIGHT / 2;
let bird_velocity = 0;
const gravity = 0.5;
const bird_flap_power = -10;
let bird_animation_index = 0;

// Bobbing effect
const bobbing_speed = 0.005;
const bobbing_amplitude = 5;

// --- Intro flap animation ---
let waiting_flap_timer = 0;
const waiting_flap_interval = 200; // Flap every 200ms
let waiting_flap_index = 0;
// --------------------------


let pipe_list = [];
const pipe_gap = 150;
const pipe_velocity = 3;

let base1_x = 0;
let base2_x = baseImage.width;
const base_y = HEIGHT - 50;
const base_velocity = 3;

let score = 0;
let high_score = localStorage.getItem('highscore') || 0;

let game_over = false;
let waiting_for_start = true;

function drawScore() {
    const scoreStr = score.toString();
    let totalWidth = 0;
    for (const digit of scoreStr) {
        totalWidth += numberImages[parseInt(digit)].width;
    }
    let x_offset = (WIDTH - totalWidth) / 2;
    for (const digit of scoreStr) {
        const num = parseInt(digit);
        ctx.drawImage(numberImages[num], x_offset, 10);
        x_offset += numberImages[num].width;
    }
}

function drawHighScore() {
    const high_score_str = high_score.toString();
    let totalWidth = 0;
    for (const digit of high_score_str) {
        totalWidth += numberImages[parseInt(digit)].width;
    }
    let x_offset = (WIDTH - totalWidth) / 2;

    for (const digit of high_score_str) {
        const num = parseInt(digit);
        ctx.drawImage(numberImages[num], x_offset, HEIGHT / 2);
        x_offset += numberImages[num].width;
    }
}

function updateHighScore() {
    if (score > high_score) {
        high_score = score;
        localStorage.setItem('highscore', high_score);
    }
}

function handleBirdMovement() {
    bird_velocity += gravity;
    bird_y += bird_velocity;

    if (bird_velocity < -1) {
        bird_animation_index = 0;
    } else if (bird_velocity < 1) {
        bird_animation_index = 1;
    } else {
        bird_animation_index = 2;
    }
}

function handlePipes() {
    for (let i = pipe_list.length - 1; i >= 0; i--) {
        pipe_list[i][0] -= pipe_velocity;
        if (pipe_list[i][0] + pipeImage.width < 0) {
            pipe_list.splice(i, 1);
            if (!game_over) {
                score++;
                pointSound.play();
            }
        }
    }

    if (pipe_list.length === 0 || pipe_list[pipe_list.length - 1][0] < WIDTH - 200) {
        const pipe_height = Math.floor(Math.random() * (400 - 200 + 1)) + 200;
        pipe_list.push([WIDTH, pipe_height]);
    }
}

function checkCollisions() {
    const bird_rect = {
        x: bird_x,
        y: bird_y,
        width: birdImages[0].width,
        height: birdImages[0].height
    };

    if (bird_y < 0 || bird_y + birdImages[0].height > base_y) {
        game_over = true;
        hitSound.play();
        gameoverSound.play();
    }

    for (const pipe of pipe_list) {
        const upper_pipe_rect = {
            x: pipe[0],
            y: pipe[1] - pipe_gap - pipeImage.height,
            width: pipeImage.width,
            height: pipeImage.height
        };
        const lower_pipe_rect = {
            x: pipe[0],
            y: pipe[1],
            width: pipeImage.width,
            height: pipeImage.height
        };
        if (
            (bird_rect.x < upper_pipe_rect.x + upper_pipe_rect.width &&
            bird_rect.x + bird_rect.width > upper_pipe_rect.x &&
            bird_rect.y < upper_pipe_rect.y + upper_pipe_rect.height &&
            bird_rect.y + bird_rect.height > upper_pipe_rect.y) ||
            (bird_rect.x < lower_pipe_rect.x + lower_pipe_rect.width &&
            bird_rect.x + bird_rect.width > lower_pipe_rect.x &&
            bird_rect.y < lower_pipe_rect.y + lower_pipe_rect.height &&
            bird_rect.y + bird_rect.height > lower_pipe_rect.y)
        ) {
            game_over = true;
            hitSound.play();
            gameoverSound.play();
        }
    }
}


function handleBase() {
    base1_x -= base_velocity;
    base2_x -= base_velocity;

    if (base1_x <= -baseImage.width) {
        base1_x = base2_x + baseImage.width;
    }
    if (base2_x <= -baseImage.width) {
        base2_x = base1_x + baseImage.width;
    }
}

function restart_game() {
    bird_y = HEIGHT / 2;
    bird_velocity = 0;
    score = 0;
    pipe_list = [];
    pipe_list.push([WIDTH, Math.floor(Math.random() * (400 - 200 + 1)) + 200]);
    game_over = false;
    waiting_for_start = true;
}

function draw() {
    ctx.drawImage(backgroundImage, 0, 0);

    for (const pipe of pipe_list) {
        // Draw bottom pipe
        ctx.drawImage(pipeImage, pipe[0], pipe[1]);

        // Draw top pipe (flipped)
        ctx.save();
        ctx.translate(pipe[0], pipe[1] - pipe_gap);
        ctx.scale(1, -1);
        ctx.drawImage(pipeImage, 0, 0);
        ctx.restore();
    }

    ctx.drawImage(baseImage, base1_x, base_y);
    ctx.drawImage(baseImage, base2_x, base_y);

    if (waiting_for_start) {
        bird_y = HEIGHT / 2 + Math.sin(Date.now() * bobbing_speed) * bobbing_amplitude;
    }

    const birdImage = waiting_for_start ? birdImages[waiting_flap_index] : birdImages[bird_animation_index];

    // Bird rotation
    ctx.save();
    // Only apply rotation when playing
    const tilt_angle = waiting_for_start ? 0 : Math.min(Math.max(-bird_velocity * 3, -30), 30);
    ctx.translate(bird_x + birdImage.width / 2, bird_y + birdImage.height / 2);
    ctx.rotate(tilt_angle * Math.PI / -180);
    ctx.drawImage(birdImage, -birdImage.width / 2, -birdImage.height / 2);
    ctx.restore();


    drawScore();

    if (waiting_for_start) {
        ctx.drawImage(messageImage, (WIDTH - messageImage.width) / 2, HEIGHT / 6);
    }

    if (game_over) {
        updateHighScore();
        ctx.drawImage(gameOverImage, (WIDTH - gameOverImage.width) / 2, HEIGHT / 4);
        ctx.drawImage(highscoreImage, (WIDTH - highscoreImage.width) / 2, HEIGHT / 2.40);
        drawHighScore();
    }
}

function gameLoop(currentTime) {
    requestAnimationFrame(gameLoop);

    const elapsed = currentTime - lastTime;

    if (elapsed > frameInterval) {
        const deltaTime = elapsed; // Time since last frame
        lastTime = currentTime - (elapsed % frameInterval);

        // --- Handle intro flap animation ---
        if (waiting_for_start) {
            waiting_flap_timer += deltaTime;
            if (waiting_flap_timer >= waiting_flap_interval) {
                waiting_flap_timer = 0;
                waiting_flap_index = (waiting_flap_index + 1) % 3; // Cycle 0, 1, 2
            }
        }
        // -----------------------------------

        if (!game_over) {
            handleBase();
        }
        if (!game_over && !waiting_for_start) {
            handleBirdMovement();
            handlePipes();
            checkCollisions();
        }

        draw();
    }
}


document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        if (waiting_for_start) {
            waiting_for_start = false;
        } else if (!game_over) {
            bird_velocity = bird_flap_power;
            wingSounds[Math.floor(Math.random() * wingSounds.length)].play();
        } else {
            restart_game();
        }
    }
});

document.addEventListener('mousedown', (e) => {
    if (e.button === 0) { // Left mouse button
        if (waiting_for_start) {
            waiting_for_start = false;
        } else if (!game_over) {
            bird_velocity = bird_flap_power;
            wingSounds[Math.floor(Math.random() * wingSounds.length)].play();
        } else {
            restart_game();
        }
    }
});


// Make sure all images are loaded before starting the game
let imagesLoaded = 0;
const totalImages = birdImages.length + 5 + numberImages.length;
function onImageLoad() {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
        gameLoop(0);
    }
}

birdImages.forEach(img => img.onload = onImageLoad);
pipeImage.onload = onImageLoad;
baseImage.onload = onImageLoad;
backgroundImage.onload = onImageLoad;
gameOverImage.onload = onImageLoad;
messageImage.onload = onImageLoad;
highscoreImage.onload = onImageLoad;
numberImages.forEach(img => img.onload = onImageLoad);
