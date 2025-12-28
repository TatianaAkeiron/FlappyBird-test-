let circleArray = [];
let circleRadius = 10;
let circleInterval = 2000;
//board
let board;
let boardWidth = 360;
let boardHeight = 640;
let context;

//bird
let birdWidth = 34;
let birdHeight = 24;
let birdX = boardWidth / 8;
let birdY = boardHeight / 2;
let birdImg;

let bird = {
  x: birdX,
  y: birdY,
  width: birdWidth,
  height: birdHeight,
};

// pipes
let pipeArray = [];
let pipeWidth = 64;
let pipeHeight = 512;
let pipeX = boardWidth;
let pipeY = 0;

let topPipeImg;
let bottomPipeImg;

// physics
let velocityX = -2;
let velocityY = 0;
let gravity = 0.4;

let gameOver = false;
let gameStarted = false;
let score = 0;

// плавное покачивание
let floatOffset = 0;
let floatSpeed = 0.05;
let floatAmplitude = 5;

window.onload = function () {
  board = document.getElementById("board");
  board.height = boardHeight;
  board.width = boardWidth;
  context = board.getContext("2d");

  birdImg = new Image();
  birdImg.src = "./flappybird.png";

  topPipeImg = new Image();
  topPipeImg.src = "./toppipe.png";

  bottomPipeImg = new Image();
  bottomPipeImg.src = "./bottompipe.png";

  birdImg.onload = () => requestAnimationFrame(update);
  setInterval(placePipes, 1500);
  document.addEventListener("keydown", moveBird);
  // setInterval(placeCircle, circleInterval);
};

function update() {
  requestAnimationFrame(update);
  context.clearRect(0, 0, board.width, board.height);

  // ------------------------
  //  ЭКРАН СТАРТА
  // ------------------------
  if (!gameStarted) {
    // затемнение заднего фона (эффект меню)
    context.fillStyle = "rgba(0,0,0,0.3)";
    context.fillRect(0, 0, board.width, board.height);

    // плавное покачивание птицы
    floatOffset += floatSpeed;
    let bobbingY = bird.y + Math.sin(floatOffset) * floatAmplitude;

    context.drawImage(birdImg, bird.x, bobbingY, bird.width, bird.height);

    // мигающий текст
    context.font = "32px sans-serif";
    context.fillStyle = `rgba(255, 255, 255, ${
      0.6 + Math.sin(floatOffset * 2) * 0.4
    })`;
    context.fillText("PRESS SPACE", 60, 200);

    return;
  }

  // ------------------------
  //  ИГРА НАЧАЛАСЬ
  // ------------------------

  if (gameOver) {
    context.fillStyle = "white";
    context.font = "45px sans-serif";
    context.fillText("GAME OVER", 5, 90);
    return;
  }

  // птица
  velocityY += gravity;
  bird.y = Math.max(bird.y + velocityY, 0);
  context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);

  if (bird.y > board.height) {
    gameOver = true;
  }

  for (let i = 0; i < circleArray.length; i++) {
    let c = circleArray[i];

    // движение кружка
    c.x += velocityX;

    // рисуем кружок
    context.beginPath();
    context.fillStyle = "gold";
    context.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
    context.fill();

    // проверка столкновения
    if (!c.collected && checkCircleCollision(bird, c)) {
      c.collected = true;
      score += 1; // бонус +1
    }
  }

  circleArray = circleArray.filter((c) => c.x > -50 && !c.collected);

  // трубы
  for (let i = 0; i < pipeArray.length; i++) {
    let pipe = pipeArray[i];
    pipe.x += velocityX;
    context.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height);

    // if (!pipe.passed && bird.x > pipe.x + pipe.width) {
    //   score += 0.5;
    //   pipe.passed = true;
    // }

    if (detectCollision(bird, pipe)) {
      gameOver = true;
    }
  }

  // удаление труб
  pipeArray = pipeArray.filter(function (pipe) {
    return pipe && typeof pipe.x === "number" && pipe.x > -pipeWidth;
  });

  // score
  context.fillStyle = "white";
  context.font = "45px sans-serif";
  context.fillText(score, 5, 45);
}

function placePipes() {
  if (!gameStarted || gameOver) return;

  let randomPipeY = pipeY - pipeHeight / 4 - Math.random() * (pipeHeight / 2);
  let openingSpace = board.height / 4;

  let topPipe = {
    img: topPipeImg,
    x: pipeX,
    y: randomPipeY,
    width: pipeWidth,
    height: pipeHeight,
    passed: false,
  };
  pipeArray.push(topPipe);

  let bottomPipe = {
    img: bottomPipeImg,
    x: pipeX,
    y: randomPipeY + pipeHeight + openingSpace,
    width: pipeWidth,
    height: pipeHeight,
    passed: false,
  };
  pipeArray.push(bottomPipe);

  // ===== КРУЖОК СТРОГО В ПРОЁМЕ =====
  let gapTop = randomPipeY + pipeHeight;
  let gapBottom = gapTop + openingSpace;

  let cx = pipeX + pipeWidth / 2;

  let cyMin = gapTop + circleRadius + 6;
  let cyMax = gapBottom - circleRadius - 6;

  if (cyMax > cyMin) {
    let circle = {
      x: cx,
      y: cyMin + Math.random() * (cyMax - cyMin),
      radius: circleRadius,
      collected: false,
    };
    circleArray.push(circle);
  }
}

function placeCircle() {
  if (!gameStarted || gameOver) return;

  let circle = {
    x: boardWidth,
    y: Math.random() * (boardHeight - 100) + 50,
    radius: circleRadius,
    collected: false,
  };

  circleArray.push(circle);
}

function moveBird(e) {
  if (e.code == "Space" || e.code == "ArrowUp" || e.code == "KeyX") {
    // старт игры
    if (!gameStarted && !gameOver) {
      gameStarted = true;
      return;
    }

    // прыжок
    velocityY = -6;

    // рестарт
    if (gameOver) {
      bird.y = birdY;
      velocityY = 0;
      pipeArray = [];
      score = 0;
      gameOver = false;
      gameStarted = false;
    }
  }
}

function detectCollision(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function checkCircleCollision(bird, circle) {
  let distX = circle.x - (bird.x + bird.width / 2);
  let distY = circle.y - (bird.y + bird.height / 2);
  let distance = Math.sqrt(distX * distX + distY * distY);

  return distance < circle.radius + Math.min(bird.width, bird.height) / 2;
}
