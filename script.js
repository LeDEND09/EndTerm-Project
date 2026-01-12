const playground = document.querySelector(".play-ground");
let smashActive = false;
let smashTimeout = null;
let timeScale = 1; // for higher speed

//ball
const ball = document.createElement("div");
ball.classList.add("ball");
playground.appendChild(ball);

//paddle
const paddle = document.createElement("div");
paddle.classList.add("paddle");
playground.appendChild(paddle);

//random color
function randomBallColor() {
  const hue = Math.floor(Math.random() * 360);
  ball.style.backgroundColor = `hsl(${hue}, 80%, 60%)`;
}

const paddleWidth = paddle.offsetWidth;

const playgroundWidth = playground.clientWidth; // clientWidth is the usable inner Width
const ballWidth = ball.offsetWidth; // offset width is the actual visible length of the element on the scren

//score

let difficultyLevel = 0;
const SPEED_INCREMENT = 0.8;
const MAX_BASE_SPEED = 20;
let score = 0;
let currentTime = 0;
let startTime = 0;
let highScore = Number(localStorage.getItem("highScore")) || 0;
let highScoreName = localStorage.getItem("highScoreName") || "Player";
let bestScoreTime = Number(localStorage.getItem("bestScoreTime")) || 0;

const scoreCounter = document.querySelector(".counter");
const timerDisplay = document.querySelector(".timer");

function updateScore() {
  score++;
  scoreCounter.textContent = score;

  let newLevel = Math.floor(score / 10);
  if (newLevel > difficultyLevel) {
    difficultyLevel = newLevel;
    ballSpeedY =
      Math.min(Math.abs(ballSpeedY) + SPEED_INCREMENT, MAX_BASE_SPEED) *
      Math.sign(ballSpeedY || 1);
  }
  maybeTriggerSmash();
}

//slowDown Effect
function maybeSlowDown() {
  if (smashActive) return;
  if (difficultyLevel < 5) return;

  if (Math.random() < 0.004) {
    timeScale = 0.6;

    setTimeout(() => {
      timeScale = 1;
    }, 120);
  }
}


//smash effect

function maybeTriggerSmash() {
  if (smashActive || score < 10) return;

  let smashChance = 1;
  if (score >= 10 && score < 50) smashChance = 0.25;
  else if (score >= 50 && score < 75) smashChance = 0.4;
  else if (score >= 75 && score <= 100) smashChance = 0.65;
  else smashChance = 0.8;

  if (Math.random() < smashChance) {
    triggerSmash();
  }
}

function triggerSmash() {
  smashActive = true;
  timeScale =1;
  const originalSpeed = Math.abs(ballSpeedY);
  const smashSpeed = originalSpeed + 6 + Math.random() * 4;
  ballSpeedY = smashSpeed;
  ballSpeedY = Math.min(ballSpeedY, playgroundHeight * 0.35);

  ball.style.boxShadow = "0 0 25px red, 0 0 45px orange";

  smashTimeout = setTimeout(() => {
    ballSpeedY = originalSpeed * 0.9;
    smashActive = false;
    timeScale =1;
    ball.style.transform = "scale(1.15)";
    setTimeout(() => (ball.style.transform = ""), 80);

    // restore normal glow
    ball.style.boxShadow = "";
  }, 650); // smash lasts 0.65 sec
}

//ball appearence
let gameRunning = false;
document.addEventListener("keydown", (e) => {
  if (e.key === " ") {
    if (!gameRunning) {
      gameRunning = true;
      ball.style.display = "block";

      // lock the mouse inside playground while playing
      // this is pointer lock api
      playground.requestPointerLock(); //pointer lock API

      ballSpeedX = (Math.random() * 16 - 8)*1.5;
      ballSpeedY = 3;

      startTime = Date.now(); // starttime
    }
  }
});

let ballX = Math.random() * (playgroundWidth - ballWidth);
let ballY = 0;

let paddleX = 0;

ball.style.left = ballX + "px";
ball.style.top = ballY + "px";

//ball movement and bottom check and reset
const playgroundHeight = playground.clientHeight;
const ballHeight = ball.offsetHeight;
let ballSpeedX = 0;
let ballSpeedY = 3;
const MAX_SPEED_Y = 9;
const TOP_HIT_BOOST = 1.8; // small boost

let resetGame = () => {
  gameRunning = false;

  ballY = 0;
  ballX = Math.random() * (playgroundWidth - ballWidth);

  ball.style.top = ballY + "px";
  ball.style.left = ballX + "px";

  ball.style.display = "none";
  document.exitPointerLock();
  if (score > highScore) {
    highScore = score;
    bestScoreTime = currentTime;

    highScoreName =
      prompt("New High Score! Enter your name:", highScoreName) ||
      highScoreName;

    localStorage.setItem("highScore", highScore);
    localStorage.setItem("highScoreName", highScoreName);
    localStorage.setItem("bestScoreTime", bestScoreTime);

    renderStats();
  }

  timerDisplay.textContent = "00:00";
  smashActive = false;
  clearTimeout(smashTimeout);
  difficultyLevel = 0;

  score = 0;
  scoreCounter.textContent = score;
};

const paddleHeight = paddle.offsetHeight;
const paddleTop = playgroundHeight - paddleHeight - 10;

//time formatting
function formatTime(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min.toString().padStart(2, "0")}:${sec
    .toString()
    .padStart(2, "0")}`;
}

let gameLoop = () => {
  if (gameRunning) {
    const prevBallY = ballY;
    ballX += ballSpeedX * timeScale;
    ballY += ballSpeedY * timeScale;
    maybeSlowDown();// sudden slowdown effect;
    ball.style.left = ballX + "px";
    ball.style.top = ballY + "px";

    currentTime = Math.floor((Date.now() - startTime) / 1000); /// updating time in seconds
    timerDisplay.textContent = formatTime(currentTime);

    // LEFT wall
    if (ballX <= 0) {
      ballX = 0;
      ballSpeedX = Math.abs(ballSpeedX) * 1.2;
    }

    // RIGHT wall
    if (ballX + ballWidth >= playgroundWidth) {
      ballX = playgroundWidth - ballWidth;
      ballSpeedX = -Math.abs(ballSpeedX) * 1.2;
    }

    // TOP wall
    if (ballY <= 0) {
      ballY = 0;

      // small random speed increase
      let boost = Math.random() * TOP_HIT_BOOST;

      ballSpeedY = Math.abs(ballSpeedY) + boost;

      // cap the speed
      if (ballSpeedY > MAX_SPEED_Y) {
        ballSpeedY = MAX_SPEED_Y * 1.25;
      }
      if (score >= 50 && !smashActive) {
        ballSpeedX *= 1.5;
        ballSpeedY *= 1.5;
        randomBallColor();
      }
    }
    if (smashActive) {
      paddleX += ballSpeedX * 0.2;
    }

    //bouncing back
    if (
      ballSpeedY > 0 &&
      prevBallY + ballHeight <= paddleTop &&
      ballY + ballHeight >= paddleTop &&
      ballX + ballWidth >= paddleX &&
      ballX <= paddleX + paddleWidth
    ) {
      ballY = paddleTop - ballHeight;
      ballSpeedY = -Math.min(Math.abs(ballSpeedY), MAX_SPEED_Y) * 1.1;
      ballSpeedX = (Math.random() * 16 - 8) * 1.1;

      ballX = Math.max(0, Math.min(ballX, playgroundWidth - ballWidth));

      updateScore();
      randomBallColor();
    }

    if (ballSpeedY > 0 && ballY + ballHeight >= playgroundHeight) {
      resetGame();
    }
  }

  requestAnimationFrame(gameLoop);
};
gameLoop();

// paddle size and position

paddleX = (playgroundWidth - paddleWidth) / 2;
paddle.style.left = paddleX + "px";

// mouse movement

playground.addEventListener("mousemove", (e) => {
  if (!gameRunning) return;

  // use relative movement
  paddleX += e.movementX;

  // clamp paddle
  if (paddleX < 0) paddleX = 5;
  if (paddleX > playgroundWidth - paddleWidth) {
    paddleX = playgroundWidth - paddleWidth;
  }

  paddle.style.left = paddleX + "px";
});

const playerDetail = document.querySelector(".stats");

function renderStats() {
  playerDetail.innerHTML = `
    <h3 style="margin-bottom: 8px;">Stats</h3>
    <p>Player Name: <strong>${highScoreName}</strong></p>
    <p>High Score: <strong>${highScore}</strong></p>
    <p>Best Time: <strong>${formatTime(bestScoreTime)}</strong></p>

  `;
}

renderStats();
