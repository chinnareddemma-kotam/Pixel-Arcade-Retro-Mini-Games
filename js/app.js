
/* Pixel Arcade: navigation, records, and shared UI */
(() => {
  const $ = id => document.getElementById(id);

  const gameNames = {
    snake: "PIXEL SNAKE",
    memory: "MEMORY FLIP",
    reaction: "REACTION RUSH",
    tictactoe: "NEON TIC-TAC-TOE",
    swan: "BUBBLES THE SWAN",
    flappy: "FLAPPY BIRD",
    cup: "CUP SHUFFLE"
  };

  const wrappers = {
    snake: "snakeWrap",
    memory: "memoryWrap",
    reaction: "reactionWrap",
    tictactoe: "tttWrap",
    swan: "swanWrap",
    flappy: "flappyWrap",
    cup: "cupShuffleWrap"
  };

  const instructions = {
    snake: "Use arrow keys or WASD to move. Don't hit the wall or yourself.",
    memory: "Flip two cards at a time. Finish in as few moves as possible.",
    reaction: "Click start, wait for green, then click as fast as you can.",
    tictactoe: "You are X. Get three in a row before the CPU.",
    swan: "Help Bubbles fly between the pipes. Press SPACE, click, or tap to flap.",
    flappy: "Guide the bird between pipes. Press SPACE, click, or tap to flap.",
    cup: "Watch the cups carefully and choose the cup hiding the ball."
  };

  let toastTimer;

  function toast(message) {
    const el = $("toast");
    if (!el) return;

    el.textContent = message;
    el.classList.add("show");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(
      () => el.classList.remove("show"),
      2300
    );
  }

  function refreshRecords() {
    const r = window.ArcadeStorage.get();

    $("snakeBest").textContent =
      String(r.snakeBest || 0).padStart(4, "0");

    $("memoryBest").textContent =
      r.memoryBest ? String(r.memoryBest).padStart(4, "0") : "----";

    $("reactionBest").textContent =
      r.reactionBest == null ? "---" : `${r.reactionBest}ms`;

    $("tttWins").textContent =
      String(r.tttWins || 0).padStart(4, "0");

    // Update these IDs after adding them to your HTML.
    if ($("swanBest")) $("swanBest").textContent = r.swanBest || 0;
    if ($("flappyBest")) $("flappyBest").textContent = r.flappyBest || 0;
    if ($("cupBest")) $("cupBest").textContent = r.cupBest || 0;

    $("heroBest").textContent = String(Math.max(
      r.snakeBest || 0,
      r.swanBest || 0,
      r.flappyBest || 0,
      r.cupBest || 0,
      r.tttWins || 0
    )).padStart(4, "0");
  }

  function openGame(game) {
    if (!wrappers[game]) return;

    // Hide all existing game panels.
    Object.values(wrappers).forEach(id => {
      const el = $(id);
      if (el) el.classList.add("hidden");
    });

    // New game wrappers are created by newgames.js.
    if (["swan", "flappy", "cup"].includes(game)) {
      if (!window.ArcadeNewGames) {
        toast("NEW GAMES SCRIPT NOT LOADED");
        return;
      }

      $("playTitle").textContent = gameNames[game];
      $("gameInstructions").textContent = instructions[game];
      $("currentScore").textContent = "0000";
      $("play").classList.remove("hidden");

      window.ArcadeNewGames.start(game);

      $("play").scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

      return;
    }

    const wrapper = $(wrappers[game]);
    if (!wrapper) {
      toast("GAME PANEL NOT FOUND");
      return;
    }

    wrapper.classList.remove("hidden");
    $("playTitle").textContent = gameNames[game];
    $("gameInstructions").textContent = instructions[game];
    $("currentScore").textContent = "0000";

    $("play").classList.remove("hidden");
    $("play").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

    if (game === "memory") {
      window.ArcadeMiniGames.startMemory();
    }

    if (game === "tictactoe") {
      window.ArcadeMiniGames.startTtt();
    }

    if (game === "reaction") {
      $("reactionPad").className = "reaction-pad";
      $("reactionPad").innerHTML =
        'PRESS START<br><small>Then wait for green...</small>';

      $("reactionStatus").textContent =
        "Your best reaction time will be saved.";
    }

    if (game === "snake") {
      toast("PRESS START TO BEGIN");
    }
  }

  document.querySelectorAll("[data-open]").forEach(btn => {
    btn.addEventListener("click", () => openGame(btn.dataset.open));
  });

  $("closeGame").addEventListener("click", () => {
    $("play").classList.add("hidden");
    $("games").scrollIntoView({ behavior: "smooth" });
  });

  document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", () => {
      document.querySelectorAll(".nav-link").forEach(item => {
        item.classList.remove("active");
      });

      link.classList.add("active");
    });
  });

  $("resetScores").addEventListener("click", () => {
    if (confirm("Reset all saved arcade records in this browser?")) {
      window.ArcadeStorage.reset();
      refreshRecords();
      toast("RECORDS RESET");
    }
  });

  let soundOn = false;
  let audioContext = null;

  $("soundToggle").addEventListener("click", () => {
    soundOn = !soundOn;
    $("soundToggle").textContent =
      `♫ SOUND: ${soundOn ? "ON" : "OFF"}`;

    $("soundToggle").setAttribute(
      "aria-pressed",
      String(soundOn)
    );

    if (soundOn) {
      try {
        audioContext = audioContext ||
          new (window.AudioContext || window.webkitAudioContext)();

        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();

        osc.frequency.value = 660;
        gain.gain.value = 0.035;

        osc.connect(gain);
        gain.connect(audioContext.destination);

        osc.start();
        osc.stop(audioContext.currentTime + 0.09);
      } catch {}

      toast("SOUND ENABLED");
    } else {
      toast("SOUND MUTED");
    }
  });

  window.addEventListener("arcade:records", refreshRecords);

  window.ArcadeApp = { refreshRecords, toast };

  $("year").textContent = new Date().getFullYear();
  $("heroGames").textContent = "07";

  refreshRecords();
})();
