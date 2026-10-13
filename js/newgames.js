
/* New games for Pixel Arcade */
(() => {
  const $ = id => document.getElementById(id);

  const games = {
    swan: {
      title: "BUBBLES THE SWAN",
      bestKey: "swanBest",
      color: "#ff80c8",
      bird: "🦢"
    },
    flappy: {
      title: "FLAPPY BIRD",
      bestKey: "flappyBest",
      color: "#ffe66d",
      bird: "🐤"
    }
  };

  let activeGame = null;
  let animationId = null;
  let gameState = null;
  let cupTimers = [];

  function stopAnimation() {
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  }

  function clearCupTimers() {
    cupTimers.forEach(timer => clearTimeout(timer));
    cupTimers = [];
  }

  function later(callback, delay) {
    const timer = setTimeout(() => {
      cupTimers = cupTimers.filter(item => item !== timer);
      if (activeGame === "cup") callback();
    }, delay);

    cupTimers.push(timer);
    return timer;
  }

  function hideOtherGames(current) {
    [
      "snakeWrap",
      "memoryWrap",
      "reactionWrap",
      "tttWrap",
      "swanWrap",
      "flappyWrap",
      "cupShuffleWrap"
    ].forEach(id => {
      const element = $(id);
      if (element && id !== current) {
        element.classList.add("hidden");
      }
    });
  }

  function getStage() {
    return document.querySelector("#play .game-panel") ||
           document.querySelector("#play .game-stage") ||
           document.querySelector("#play");
  }

  function createCanvasGame(game) {
    let wrapper = $(game + "Wrap");

    if (!wrapper) {
      wrapper = document.createElement("section");
      wrapper.id = game + "Wrap";
      wrapper.className = "game-stage hidden";
      getStage().appendChild(wrapper);
    }

    if (!$(game + "Canvas")) {
      wrapper.innerHTML = `
        <div class="newgame-panel">
          <h2>${games[game].title}</h2>

          <div class="newgame-hud">
            <span>SCORE: <b id="${game}Score">0</b></span>
            <span>BEST: <b id="${game}Best">0</b></span>
          </div>

          <canvas
            id="${game}Canvas"
            width="640"
            height="420"
            aria-label="${games[game].title} game"
            tabindex="0"
          ></canvas>

          <p id="${game}Message">
            Click the game or press SPACE to flap!
          </p>

          <button id="${game}Start" class="game-launch">
            START GAME
          </button>
        </div>
      `;
    }

    return wrapper;
  }

  function startCanvasGame(game) {
    activeGame = game;
    stopAnimation();
    clearCupTimers();

    const config = games[game];
    const wrapper = createCanvasGame(game);

    hideOtherGames(wrapper.id);
    wrapper.classList.remove("hidden");

    const canvas = $(game + "Canvas");
    const ctx = canvas.getContext("2d");
    const scoreEl = $(game + "Score");
    const bestEl = $(game + "Best");
    const message = $(game + "Message");
    const startBtn = $(game + "Start");

    let best = window.ArcadeStorage.get()[config.bestKey] || 0;
    bestEl.textContent = best;

    gameState = {
      birdY: 190,
      velocity: 0,
      pipes: [],
      score: 0,
      frame: 0,
      running: false,
      over: false
    };

    function reset() {
      if (activeGame !== game) return;

      stopAnimation();

      gameState = {
        birdY: 190,
        velocity: 0,
        pipes: [],
        score: 0,
        frame: 0,
        running: true,
        over: false
      };

      scoreEl.textContent = "0";
      message.textContent = "Flap to avoid the pipes!";
      startBtn.textContent = "RESTART";

      gameState.pipes.push({
        x: canvas.width + 40,
        gapY: 190,
        scored: false
      });

      draw();
    }

    function flap() {
      if (activeGame !== game || !gameState) return;

      if (!gameState.running) {
        if (gameState.over) {
          reset();
        } else {
          reset();
        }
        return;
      }

      gameState.velocity = game === "swan" ? -2.5 : -5.5;
    }

    function finish() {
      if (!gameState.running) return;

      gameState.running = false;
      gameState.over = true;

      message.textContent =
        `GAME OVER! Score: ${gameState.score}. Click or press SPACE to retry.`;

      startBtn.textContent = "PLAY AGAIN";

      if (gameState.score > best) {
        best = gameState.score;
        window.ArcadeStorage.setBest(config.bestKey, best);
        bestEl.textContent = best;
      }

      if (window.ArcadeApp) {
        window.ArcadeApp.refreshRecords();
      }
    }


    function draw() {
    if (activeGame !== game || !gameState) return;

    const w = canvas.width;
    const h = canvas.height;
    const birdX = 120;
    const birdRadius = 15;
    const pipeWidth = 62;
    const gap = game === "swan" ? 170 : 150;

    ctx.clearRect(0, 0, w, h);

    // Background
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, "#11172e");
    gradient.addColorStop(1, "#242044");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    // Stars
    ctx.fillStyle = "#ffffff";

    for (let i = 0; i < 25; i++) {
        const x = (i * 83 + 23) % w;
        const y = (i * 47 + 17) % (h - 20);
        ctx.fillRect(x, y, 2, 2);
    }

    // Floating bubbles: only for Bubbles the Swan
    if (game === "swan") {
        for (let i = 0; i < 22; i++) {
        const radius = 3 + (i % 4) * 2;

        const x =
            (i * 71 +
            Math.sin((gameState.frame + i * 15) * 0.025) * 18 + w) % w;

        const y =
            h - ((gameState.frame * 1.2 + i * 37) % (h + 30));

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(102, 225, 255, 0.12)";
        ctx.fill();
        ctx.strokeStyle = "rgba(102, 225, 255, 0.75)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Bubble shine
        ctx.beginPath();
        ctx.arc(
            x - radius * 0.3,
            y - radius * 0.3,
            Math.max(1, radius * 0.2),
            0,
            Math.PI * 2
        );
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        }
    }

    if (gameState.running) {
        gameState.frame++;

        // Slower fall for Swan; normal gravity for Flappy Bird
        const gravity = game === "swan" ? 0.08 : 0.18;
        const maxFallSpeed = game === "swan" ? 2.5 : 5;

        gameState.velocity += gravity;
        gameState.velocity = Math.min(gameState.velocity, maxFallSpeed);
        gameState.birdY += gameState.velocity;

        // Create pipes
        if (gameState.frame % 100 === 1 && gameState.frame > 1) {
        gameState.pipes.push({
            x: w + 20,
            gapY: 95 + Math.random() * 210,
            scored: false
        });
        }

        for (const pipe of gameState.pipes) {
        pipe.x -= game === "swan" ? 2.5 : 3;

        const topHeight = Math.max(0, pipe.gapY - gap / 2);
        const bottomY = pipe.gapY + gap / 2;

        // Pipes
        ctx.fillStyle = config.color;
        ctx.fillRect(pipe.x, 0, pipeWidth, topHeight);
        ctx.fillRect(
            pipe.x,
            bottomY,
            pipeWidth,
            Math.max(0, h - bottomY - 12)
        );

        // Pipe caps
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(
            pipe.x - 4,
            Math.max(0, topHeight - 10),
            pipeWidth + 8,
            10
        );
        ctx.fillRect(
            pipe.x - 4,
            bottomY,
            pipeWidth + 8,
            10
        );

        // Collision detection
        const overlaps =
            birdX + birdRadius > pipe.x &&
            birdX - birdRadius < pipe.x + pipeWidth;

        if (
            overlaps &&
            (
            gameState.birdY - birdRadius < pipe.gapY - gap / 2 ||
            gameState.birdY + birdRadius > pipe.gapY + gap / 2
            )
        ) {
            finish();
            break;
        }

        // Score
        if (!pipe.scored && pipe.x + pipeWidth < birdX) {
            pipe.scored = true;
            gameState.score++;
            scoreEl.textContent = gameState.score;
        }
        }

        gameState.pipes = gameState.pipes.filter(
        pipe => pipe.x > -pipeWidth - 10
        );

        // Ceiling and ground collision
        if (
        gameState.birdY - birdRadius < 0 ||
        gameState.birdY + birdRadius > h - 12
        ) {
        finish();
        }
    }

    // Ground
    ctx.fillStyle = "#75f0bb";
    ctx.fillRect(0, h - 12, w, 12);

    // Swan or bird
    ctx.font = "36px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(config.bird, birdX, gameState.birdY);

    if (!gameState.running && !gameState.over) {
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 22px monospace";
        ctx.fillText("READY?", w / 2, 80);
    }

    if (gameState.running) {
        animationId = requestAnimationFrame(draw);
    } else {
        animationId = null;
    }
    }


    canvas.onclick = flap;

    canvas.ontouchstart = event => {
      event.preventDefault();
      flap();
    };

    startBtn.onclick = reset;

    // Bind keyboard controls only once.
    if (!canvas.dataset.keyboardBound) {
      window.addEventListener("keydown", event => {
        if (
          activeGame === game &&
          (
            event.code === "Space" ||
            event.code === "ArrowUp"
          )
        ) {
          const target = event.target;

          if (
            target &&
            (
              target.tagName === "BUTTON" ||
              target.tagName === "INPUT" ||
              target.tagName === "TEXTAREA"
            ) &&
            event.code === "Space"
          ) {
            return;
          }

          event.preventDefault();
          flap();
        }
      });

      canvas.dataset.keyboardBound = "true";
    }

    reset();
  }

  // CUP SHUFFLE
  function startCupGame() {
    activeGame = "cup";
    stopAnimation();
    clearCupTimers();

    let wrapper = $("cupShuffleWrap");

    if (!wrapper) {
      wrapper = document.createElement("section");
      wrapper.id = "cupShuffleWrap";
      wrapper.className = "game-stage hidden";
      getStage().appendChild(wrapper);
    }

    if (!wrapper.querySelector(".cup")) {
      wrapper.innerHTML = `
        <div class="newgame-panel cup-panel">
          <h2>🥤 CUP SHUFFLE</h2>
          <p id="cupMessage">
            Watch carefully! Find the hidden ball.
          </p>

          <div id="cupArea" class="cup-area">
            <button class="cup" data-cup="0" aria-label="Cup 1">🥤</button>
            <button class="cup" data-cup="1" aria-label="Cup 2">🥤</button>
            <button class="cup" data-cup="2" aria-label="Cup 3">🥤</button>
          </div>

          <p>
            LEVEL: <b id="cupLevel">1</b> |
            SCORE: <b id="cupScore">0</b> |
            BEST: <b id="cupBest">0</b>
          </p>

          <button id="cupStart" class="game-launch">
            START SHUFFLE
          </button>
        </div>
      `;
    }

    hideOtherGames(wrapper.id);
    wrapper.classList.remove("hidden");

    const cups = [...wrapper.querySelectorAll(".cup")];
    const message = $("cupMessage");
    const levelEl = $("cupLevel");
    const scoreEl = $("cupScore");
    const bestEl = $("cupBest");
    const startBtn = $("cupStart");

    let level = 1;
    let score = 0;
    let best = window.ArcadeStorage.get().cupBest || 0;
    let ballPosition = 0;
    let busy = false;
    let round = 0;

    bestEl.textContent = best;

    function renderCups(reveal = false) {
      cups.forEach((cup, index) => {
        cup.textContent =
          reveal && index === ballPosition ? "⚽" : "🥤";
        cup.disabled = busy;
      });
    }

    function swapCups(first, second, done) {
      const cupA = cups[first];
      const cupB = cups[second];

      const positions = cups.map(cup => cup.style.transform);
      const distance = cupB.offsetLeft - cupA.offsetLeft;

      cupA.style.transition = "transform 350ms ease";
      cupB.style.transition = "transform 350ms ease";

      cupA.style.transform = `translateX(${distance}px)`;
      cupB.style.transform = `translateX(${-distance}px)`;

      // Track the hidden ball's logical position during the swap.
      if (ballPosition === first) {
        ballPosition = second;
      } else if (ballPosition === second) {
        ballPosition = first;
      }

      later(() => {
        // Reorder the actual cup elements, not just their visuals.
        const parent = cupA.parentNode;

        if (first < second) {
          parent.insertBefore(cupB, cupA);
        } else {
          parent.insertBefore(cupA, cupB);
        }

        cups.sort((a, b) =>
          Number(a.dataset.cup) - Number(b.dataset.cup)
        );

        cups.forEach(cup => {
          cup.style.transition = "";
          cup.style.transform = "";
        });

        if (done) done();
      }, 370);
    }

    function shuffle(count) {
      if (activeGame !== "cup") return;

      if (count <= 0) {
        busy = false;
        message.textContent = "Choose the cup hiding the ball!";
        renderCups(false);
        return;
      }

      let first = Math.floor(Math.random() * 3);
      let second = Math.floor(Math.random() * 3);

      while (second === first) {
        second = Math.floor(Math.random() * 3);
      }

      swapCups(first, second, () => {
        later(() => shuffle(count - 1), 120);
      });
    }

    function beginRound() {
      clearCupTimers();

      round++;
      ballPosition = Math.floor(Math.random() * 3);
      busy = true;

      message.textContent = "Remember where the ball is...";
      renderCups(true);

      later(() => {
        renderCups(false);
        message.textContent = "Watch the cups shuffle!";
        shuffle(Math.min(4 + level, 12));
      }, 900);
    }

    function resetCups() {
      clearCupTimers();

      level = 1;
      score = 0;
      round = 0;
      busy = false;

      cups.forEach(cup => {
        cup.style.transition = "";
        cup.style.transform = "";
        cup.disabled = false;
      });

      levelEl.textContent = level;
      scoreEl.textContent = score;
      startBtn.textContent = "RESTART GAME";

      // Ensure cup order is restored at the start.
      const area = $("cupArea");
      cups.sort((a, b) =>
        Number(a.dataset.cup) - Number(b.dataset.cup)
      );
      cups.forEach(cup => area.appendChild(cup));

      beginRound();
    }

    cups.forEach(cup => {
      cup.onclick = () => {
        if (activeGame !== "cup" || busy) return;

        busy = true;
        const selectedIndex = cups.indexOf(cup);

        if (selectedIndex === ballPosition) {
          score += 10 * level;
          level++;

          scoreEl.textContent = score;
          levelEl.textContent = level;
          message.textContent = "Correct! 🎉 Next level!";

          window.ArcadeStorage.setBest("cupBest", score);
          best = Math.max(best, score);
          bestEl.textContent = best;

          renderCups(true);

          later(() => {
            beginRound();
          }, 900);
        } else {
          message.textContent = `Game over! Final score: ${score}`;
          renderCups(true);
          cup.textContent = "❌";

          cups.forEach(item => item.disabled = true);
          busy = true;

          if (window.ArcadeApp) {
            window.ArcadeApp.refreshRecords();
          }
        }
      };
    });

    startBtn.onclick = resetCups;

    resetCups();
  }

  window.ArcadeNewGames = {
    start(game) {
      if (game === "swan" || game === "flappy") {
        startCanvasGame(game);
      } else if (game === "cup") {
        startCupGame();
      }
    }
  };
})();
