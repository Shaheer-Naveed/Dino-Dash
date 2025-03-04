// Canvas
let board, context;
let boardWidth = 1002;
let boardHeight = 750;
let isFullScreen = false;

// Character
let characterWidth = boardWidth * 0.08;
let characterHeight = boardHeight * 0.23;
let characterX = boardWidth / 10;
let groundLevel = boardHeight - boardHeight * 0.25; 
let characterY = groundLevel - characterHeight;
let velocityY = 0;

// Game Physics and Difficulty Settings 
let velocityX = 4;
let maxSpeed = 12; 
let difficultyIncreaseInterval = 20000; 
let gravity = boardHeight * 0.003;
let jumpStrength = -boardHeight * 0.04; 
let collisionBuffer = 0.25; 

let isJumping = false;
let gameStarted = false;
let characterImage;
let character = { x: characterX, y: characterY, width: characterWidth, height: characterHeight };

// Obstacles
let obstacleArray = [];
let obstacleWidth = boardWidth * 0.06;
let obstacleHeight = boardHeight * 0.12; 

let obstacleImage;

// Score
let score = 0;

// Background
let backgroundImage = new Image();
backgroundImage.src = "bg.jpg";
let thumbnailImage = new Image();
thumbnailImage.src = "thumbnail.PNG";

// Sounds
let bgmusic = new Audio("bg-music.mp3");
let jumpsound = new Audio("jump.wav");
let endgame = new Audio("game-over.mp3");
bgmusic.loop = true;

// Game State
let gameOver = false;

//  Thumbnail 
function drawThumbnailScreen() {
    context.clearRect(0, 0, board.width, board.height);
    if (thumbnailImage.complete) {
        context.drawImage(thumbnailImage, 0, 0, board.width, board.height);
        context.fillStyle = "yellow";
        context.font = "50px Cursive";
        context.textAlign = "center";
        context.fillText("Click to Play", board.width / 2, board.height / 2);
    } else {
        thumbnailImage.onload = function () {
            context.drawImage(thumbnailImage, 0, 0, board.width, board.height);
            context.fillStyle = "yellow";
            context.font = "50px Cursive";
            context.textAlign = "center";
            context.fillText("Click to Play", board.width / 2, board.height / 2);
        };
    }
}

window.onload = function () {
    board = document.getElementById("board");
    board.width = boardWidth;
    board.height = boardHeight;
    context = board.getContext("2d");

    characterImage = new Image();
    characterImage.src = "dinosaur.png";

    obstacleImage = new Image();
    obstacleImage.src = "cactus.png";

    board.addEventListener("click", enterFullScreen);
    drawThumbnailScreen();

    // FullScreen Event Listener
    document.addEventListener("fullscreenchange", () => {
        if (!document.fullscreenElement) {
            isFullScreen = false;
            document.getElementById("gameOverPopup").style.display = "none";
            gameOver = true;
            bgmusic.pause();
            bgmusic.currentTime = 0;
            gameStarted = false;
            obstacleArray = [];
            drawThumbnailScreen();
            document.getElementById("scoreContainer").style.display = "none";
        }
    });
};

// Enter Full-Screen Mode and Start Game
function enterFullScreen() {
    let gameContainer = document.querySelector(".game");

    if (!document.fullscreenElement) {
        isFullScreen = true;
        gameContainer.requestFullscreen()
            .then(() => {
                resizeCanvas();
                document.getElementById("scoreContainer").style.display = "flex";

                if (!gameStarted) {
                    startGame();
                }
            })
            .catch(err => console.log("Fullscreen error:", err));
    }
}
document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement) {
        isFullScreen = false;
        gameOver = true;
        bgmusic.pause();
        bgmusic.currentTime = 0;
        gameStarted = false;
        obstacleArray = [];
        drawThumbnailScreen();
        document.getElementById("scoreContainer").style.display = "none";
    }
});

// Resize canvas properly in fullscreen
function resizeCanvas() {
    board.width = window.innerWidth;
    board.height = window.innerHeight;
    boardWidth = board.width;
    boardHeight = board.height;

    groundLevel = boardHeight - boardHeight * 0.25;
    character.width = boardWidth * 0.08;
    character.height = boardHeight * 0.23;
    character.x = boardWidth / 10;
    character.y = groundLevel - character.height;

    jumpStrength = -boardHeight * 0.035;
    gravity = boardHeight * 0.002;

    obstacleWidth = boardWidth * 0.06;
    obstacleHeight = boardHeight * 0.12;

    obstacleArray.forEach(obstacle => {
        obstacle.width = obstacleWidth;
        obstacle.height = obstacleHeight;
        obstacle.y = groundLevel - obstacleHeight;
    });
}
function checkCollision(character, obstacle) {
    let bufferX = character.width * collisionBuffer;
    let bufferY = character.height * collisionBuffer; 

    return (
        character.x + bufferX < obstacle.x + obstacle.width - bufferX &&
        character.x + character.width - bufferX > obstacle.x + bufferX &&
        character.y + bufferY < obstacle.y + obstacle.height - bufferY &&
        character.y + character.height - bufferY > obstacle.y + bufferY
    );
}

// Start Game and Difficulty Scaling
function startGame() {
    gameStarted = true;
    bgmusic.play().catch(error => console.log("Audio play blocked:", error));
    requestAnimationFrame(update);
    setInterval(addObstacle, 2500); 

    setInterval(() => {
        if (!gameOver && gameStarted) {
            velocityX = Math.min(maxSpeed, velocityX + 0.5);
            gravity = Math.min(boardHeight * 0.004, gravity + boardHeight * 0.0003);
            jumpStrength = Math.max(-boardHeight * 0.05, jumpStrength - boardHeight * 0.002);
        }
    }, difficultyIncreaseInterval);
}

// Game Loop
function update() {
    if (gameOver) return; 
    requestAnimationFrame(update); 
    context.clearRect(0, 0, board.width, board.height);
    context.drawImage(backgroundImage, 0, 0, board.width, board.height);

    // Update character physics
    velocityY += gravity;
    character.y += velocityY;

    if (character.y + character.height >= groundLevel) {
        character.y = groundLevel - character.height;
        isJumping = false;
    }

    context.drawImage(characterImage, character.x, character.y, character.width, character.height);

    // Move obstacles and check for collisions
    for (let i = 0; i < obstacleArray.length; i++) {
        let obstacle = obstacleArray[i];
        obstacle.x -= velocityX;
        context.drawImage(obstacle.img, obstacle.x, obstacle.y, obstacle.width, obstacle.height);

        if (!obstacle.passed && character.x > obstacle.x + obstacle.width) {
            score += 1;
            obstacle.passed = true;
        }

        if (checkCollision(character, obstacle)) {
            endgame.play();
            gameOver = true;
            bgmusic.pause();
            bgmusic.currentTime = 0;
            showGameOver(); 
            return; 
        }
    }

    document.getElementById("score").innerText = score;
    obstacleArray = obstacleArray.filter(obstacle => obstacle.x + obstacle.width > 0);
}

// Spawn Obstacles
function addObstacle() {
    let obstacle = {
        img: obstacleImage,
        x: board.width,
        y: groundLevel - obstacleHeight,
        width: obstacleWidth,
        height: obstacleHeight,
        passed: false
    };
    obstacleArray.push(obstacle);
}

// Jump Mechanism
function moveCharacter(e) {
    if (!isFullScreen) return;

    if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyX") {
        e.preventDefault();
        if (gameOver) {
            restartGame();
            return;
        }
        if (!gameStarted) {
            startGame();
        }
        if (!isJumping) {
            jumpsound.play();
            velocityY = jumpStrength;
            isJumping = true;
        }
    }
}

window.addEventListener("keydown", moveCharacter);

// Show Game Over Popup
function showGameOver() {
    if (!isFullScreen) return; 
    document.getElementById("gameOverPopup").style.display = "block";
    document.getElementById("finalScore").innerText = score;
    document.getElementById("scoreContainer").style.display = "none";
}

// Restart Game Function
function restartGame() {
    gameOver = false;
    score = 0;
    velocityX = 4; // Reset to initial slower speed
    character.y = groundLevel - character.height;
    velocityY = 0;
    isJumping = false;
    obstacleArray = [];

    bgmusic.currentTime = 0;

    // Check if fullscreen is active
    if (!document.fullscreenElement) {
        let gameContainer = document.querySelector(".game");
        gameContainer.requestFullscreen()
            .then(() => {
                isFullScreen = true;
                resizeCanvas();
                bgmusic.play();
                document.getElementById("gameOverPopup").style.display = "none";
                document.getElementById("scoreContainer").style.display = "flex";
                requestAnimationFrame(update);
            })
            .catch(err => console.log("Fullscreen error:", err));
    } else {
        bgmusic.play();
        document.getElementById("gameOverPopup").style.display = "none";
        document.getElementById("scoreContainer").style.display = "flex";
        requestAnimationFrame(update);
    }
}