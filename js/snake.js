
/* Snake Arcade — Canvas 2D */
(() => {
  const canvas = document.getElementById("snakeCanvas");
  const ctx = canvas.getContext("2d");

  const SIZE = 20;
  const COLS = canvas.width / SIZE;
  const ROWS = canvas.height / SIZE;

  const startBtn = document.getElementById("snakeStart");
  const scoreEl = document.getElementById("currentScore");
  const wrap = document.getElementById("snakeWrap");

  // Game configuration
  const INITIAL_SPEED = 150;
  const MIN_SPEED = 65;
  const SPEED_STEP = 10;
  const POINTS_PER_FOOD = 10;
  const FOODS_PER_LEVEL = 5;

  const BEST_KEY = "snakeBest";

  let snake = [];
  let food = null;
  let direction = { x: 1, y: 0 };
  let nextDirection = { x: 1, y: 0 };
  let score = 0;
  let level = 1;
  let timer = null;
  let state = "ready";
  let audioContext = null;

  let bestScore = Number(
    localStorage.getItem(BEST_KEY) || 0
  );

  // Optional existing website integration
  function notify(message) {
    if (window.ArcadeApp?.toast) {
      window.ArcadeApp.toast(message);
    }
  }

  function refreshRecords() {
    if (window.ArcadeApp?.refreshRecords) {
      window.ArcadeApp.refreshRecords();
    }
  }

  function saveBest() {
    if (score > bestScore) {
      bestScore = score;

      try {
        localStorage.setItem(BEST_KEY, String(bestScore));
      } catch (error) {
        console.warn("Could not save high score:", error);
      }

      // Keep your existing arcade records in sync
      try {
        window.ArcadeStorage?.setBest?.(
          BEST_KEY,
          bestScore
        );
      } catch (error) {
        console.warn("Arcade record update failed:", error);
      }

      refreshRecords();
    }
  }

  // Sound effects: no external audio library required
  function playSound(frequency, duration = 0.09, type = "sine") {
    try {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioContextClass) return;

      if (!audioContext) {
        audioContext = new AudioContextClass();
      }

      if (audioContext.state === "suspended") {
        audioContext.resume();
      }

      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const now = audioContext.currentTime;

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + duration
      );

      oscillator.connect(gain);
      gain.connect(audioContext.destination);

      oscillator.start(now);
      oscillator.stop(now + duration);
    } catch (error) {
      // The game remains playable if audio is unavailable.
    }
  }

  function currentSpeed() {
    return Math.max(
      MIN_SPEED,
      INITIAL_SPEED - (level - 1) * SPEED_STEP
    );
  }

  function updateScore() {
    scoreEl.textContent = String(score).padStart(4, "0");

    const bestEl = document.getElementById("snakeBestScore");
    if (bestEl) bestEl.textContent = String(bestScore).padStart(4, "0");

    const levelEl = document.getElementById("snakeLevel");
    if (levelEl) levelEl.textContent = String(level);
  }

  function updateButton() {
    if (state === "playing") {
      startBtn.textContent = "RESTART GAME";
    } else if (state === "paused") {
      startBtn.textContent = "RESUME GAME";
    } else if (state === "gameover") {
      startBtn.textContent = "PLAY AGAIN";
    } else {
      startBtn.textContent = "START GAME";
    }
  }

  function randomFood() {
    const emptyCells = [];

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (!snake.some(part => part.x === x && part.y === y)) {
          emptyCells.push({ x, y });
        }
      }
    }

    // Handles a completely filled board
    if (emptyCells.length === 0) return null;

    return emptyCells[
      Math.floor(Math.random() * emptyCells.length)
    ];
  }

  function reset() {
    clearInterval(timer);

    score = 0;
    level = 1;

    snake = [
      { x: 7, y: 9 },
      { x: 6, y: 9 },
      { x: 5, y: 9 }
    ];

    direction = { x: 1, y: 0 };
    nextDirection = { ...direction };
    food = randomFood();

    state = "playing";

    updateScore();
    updateButton();
    draw();
    startTimer();
  }

  function startTimer() {
    clearInterval(timer);

    timer = setInterval(tick, currentSpeed());
  }

  function pauseGame() {
    if (state !== "playing") return;

    clearInterval(timer);
    timer = null;
    state = "paused";

    updateButton();
    playSound(330, 0.12);
    draw();
  }

  function resumeGame() {
    if (state !== "paused") return;

    state = "playing";
    updateButton();
    startTimer();
    draw();
  }

  function finishGame(won = false) {
    clearInterval(timer);
    timer = null;

    state = "gameover";

    saveBest();
    updateScore();
    updateButton();
    draw();

    if (won) {
      playSound(880, 0.25, "triangle");
      notify("BOARD CLEARED! SCORE " + score);
    } else {
      playSound(150, 0.3, "sawtooth");
      notify("GAME OVER — SCORE " + score);
    }

    refreshRecords();
  }

  function tick() {
    if (state !== "playing") return;

    direction = { ...nextDirection };

    const head = {
      x: snake[0].x + direction.x,
      y: snake[0].y + direction.y
    };

    const hitWall =
      head.x < 0 ||
      head.x >= COLS ||
      head.y < 0 ||
      head.y >= ROWS;

    const eating =
      food !== null &&
      head.x === food.x &&
      head.y === food.y;

    // When not eating, the tail moves away on this tick.
    // Moving into that departing cell is allowed.
    const bodyToCheck = eating
      ? snake
      : snake.slice(0, -1);

    const hitBody = bodyToCheck.some(
      part => part.x === head.x && part.y === head.y
    );

    if (hitWall || hitBody) {
      finishGame();
      return;
    }

    snake.unshift(head);

    if (eating) {
      score += POINTS_PER_FOOD;

      const previousLevel = level;

      level = Math.floor(
        score / (POINTS_PER_FOOD * FOODS_PER_LEVEL)
      ) + 1;

      food = randomFood();

      if (food === null) {
        updateScore();
        finishGame(true);
        return;
      }

      updateScore();
      playSound(600 + level * 50, 0.1);

      if (level > previousLevel) {
        playSound(900, 0.18, "triangle");
        notify("LEVEL " + level + "!");
        startTimer();
      }
    } else {
      snake.pop();
    }

    draw();
  }

  function draw() {
    ctx.fillStyle = "#09091a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Original neon grid
    ctx.strokeStyle = "#1a1a36";
    ctx.lineWidth = 1;

    for (let x = 0; x <= canvas.width; x += SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    for (let y = 0; y <= canvas.height; y += SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Pink food
    if (food) {
      ctx.fillStyle = "#ff4fa3";
      ctx.shadowColor = "#ff4fa3";
      ctx.shadowBlur = 12;

      ctx.fillRect(
        food.x * SIZE + 3,
        food.y * SIZE + 3,
        SIZE - 6,
        SIZE - 6
      );

      ctx.shadowBlur = 0;
    }

    // Green body, yellow head
    snake.forEach((part, index) => {
      ctx.fillStyle = index === 0 ? "#ffe66d" : "#70ff9b";

      ctx.fillRect(
        part.x * SIZE + 2,
        part.y * SIZE + 2,
        SIZE - 4,
        SIZE - 4
      );
    });

    // Game state overlay
    if (state !== "playing") {
      const messages = {
        ready: ["SNAKE ARCADE", "PRESS START TO PLAY"],
        paused: ["GAME PAUSED", "PRESS P TO RESUME"],
        gameover: ["GAME OVER", "SCORE: " + score]
      };

      const lines = messages[state];

      ctx.fillStyle = "rgba(9, 9, 26, 0.82)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.textAlign = "center";
      ctx.fillStyle = "#ffe66d";
      ctx.font = "bold 23px monospace";
      ctx.fillText(
        lines[0],
        canvas.width / 2,
        canvas.height / 2 - 12
      );

      ctx.fillStyle = "#f4f2ff";
      ctx.font = "13px monospace";
      ctx.fillText(
        lines[1],
        canvas.width / 2,
        canvas.height / 2 + 20
      );
    }
  }

  // Keyboard controls
  window.addEventListener("keydown", event => {
    if (wrap.classList.contains("hidden")) return;

    const key = event.key.toLowerCase();

    if (
      ["arrowup", "arrowdown", "arrowleft", "arrowright", " "]
        .includes(key)
    ) {
      event.preventDefault();
    }

    if (key === "p" || key === "escape") {
      if (state === "playing") pauseGame();
      else if (state === "paused") resumeGame();
      return;
    }

    const keys = {
      arrowup: [0, -1],
      w: [0, -1],
      arrowdown: [0, 1],
      s: [0, 1],
      arrowleft: [-1, 0],
      a: [-1, 0],
      arrowright: [1, 0],
      d: [1, 0]
    };

    const move = keys[key];
    if (!move || state !== "playing") return;

    const [x, y] = move;

    // Prevent an immediate 180-degree turn
    if (x === -direction.x && y === -direction.y) return;

    nextDirection = { x, y };
  });

  // Existing start button doubles as restart/resume
  startBtn.addEventListener("click", () => {
    if (state === "paused") {
      resumeGame();
    } else {
      reset();
    }
  });

  // Optional dedicated pause button
  const pauseBtn = document.getElementById("snakePause");

  if (pauseBtn) {
    pauseBtn.addEventListener("click", () => {
      if (state === "playing") pauseGame();
      else if (state === "paused") resumeGame();
    });
  }

  // Initial screen
  updateScore();
  updateButton();
  draw();
})();
