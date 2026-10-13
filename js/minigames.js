/* Memory, reaction-time, and Tic-Tac-Toe games. */
(() => {
  const $ = id => document.getElementById(id);
  // Memory Flip
  const symbols = ["◆", "★", "♥", "●", "✦", "☂", "♣", "☻"];
  let cards = [], chosen = [], locked = false, moves = 0, matches = 0;
  function startMemory() {
    cards = [...symbols, ...symbols].sort(() => Math.random() - .5);
    chosen = []; locked = false; moves = 0; matches = 0;
    $("memoryStatus").textContent = "Find all 8 pairs. Moves: 0";
    $("currentScore").textContent = "0000";
    $("memoryBoard").innerHTML = "";
    cards.forEach((symbol, i) => {
      const btn = document.createElement("button");
      btn.className = "memory-card"; btn.textContent = "?"; btn.setAttribute("aria-label", "Hidden card");
      btn.addEventListener("click", () => flip(btn, i, symbol));
      $("memoryBoard").appendChild(btn);
    });
  }
  function flip(btn, i, symbol) {
    if (locked || btn.classList.contains("flipped") || btn.classList.contains("matched")) return;
    btn.textContent = symbol; btn.classList.add("flipped"); btn.setAttribute("aria-label", symbol);
    chosen.push({ btn, i, symbol });
    if (chosen.length !== 2) return;
    moves++; $("currentScore").textContent = String(moves).padStart(4, "0");
    if (chosen[0].symbol === chosen[1].symbol) {
      chosen.forEach(c => c.btn.classList.add("matched")); matches++; chosen = [];
      $("memoryStatus").textContent = `Match! ${matches}/8 pairs · ${moves} moves`;
      if (matches === 8) {
        const improved = window.ArcadeStorage.setBest("memoryBest", moves, true);
        window.ArcadeApp.refreshRecords();
        $("memoryStatus").textContent = `YOU WIN! Completed in ${moves} moves.`;
        window.ArcadeApp.toast(improved ? "NEW MEMORY RECORD!" : "ARCADE CLEAR!");
      }
    } else {
      locked = true; $("memoryStatus").textContent = `No match. Moves: ${moves}`;
      setTimeout(() => { chosen.forEach(c => { c.btn.textContent = "?"; c.btn.classList.remove("flipped"); c.btn.setAttribute("aria-label", "Hidden card"); }); chosen = []; locked = false; }, 700);
    }
  }
  $("memoryRestart").addEventListener("click", startMemory);

  // Reaction Rush: timer is intentionally delayed randomly; early clicks are false starts.
  let reactionTimer = null, readyAt = 0, reactionState = "idle";
  function reactionClick() {
    const pad = $("reactionPad");
    if (reactionState === "idle" || reactionState === "done" || reactionState === "early") {
      clearTimeout(reactionTimer); pad.className = "reaction-pad waiting";
      pad.innerHTML = "WAIT FOR GREEN...<br><small>Don't click too soon!</small>";
      $("reactionStatus").textContent = "Get ready...";
      reactionState = "waiting";
      reactionTimer = setTimeout(() => {
        reactionState = "ready"; readyAt = performance.now(); pad.className = "reaction-pad ready";
        pad.innerHTML = "CLICK NOW!<br><small>GO GO GO!</small>";
      }, 1300 + Math.random() * 2500);
    } else if (reactionState === "waiting") {
      clearTimeout(reactionTimer); reactionState = "early"; pad.className = "reaction-pad";
      pad.innerHTML = "TOO SOON!<br><small>Click to try again</small>"; $("reactionStatus").textContent = "False start — wait for green.";
    } else if (reactionState === "ready") {
      const ms = Math.round(performance.now() - readyAt);
      reactionState = "done"; pad.className = "reaction-pad";
      pad.innerHTML = `${ms} MS<br><small>Click to play again</small>`;
      $("reactionStatus").textContent = ms < 250 ? "Lightning fast!" : ms < 400 ? "Nice reflexes!" : "Keep practising!";
      $("currentScore").textContent = String(ms).padStart(4, "0");
      window.ArcadeStorage.setBest("reactionBest", ms, true); window.ArcadeApp.refreshRecords();
      window.ArcadeApp.toast("REACTION TIME: " + ms + " MS");
    }
  }
  $("reactionPad").addEventListener("click", reactionClick);

  // Tic-Tac-Toe: human is X, CPU uses a simple win/block heuristic.
  let board = Array(9).fill(""), ended = false, busy = false;
  const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  function winner(b, mark) { return wins.some(line => line.every(i => b[i] === mark)); }
  function drawBoard() {
    $("tttBoard").innerHTML = "";
    board.forEach((mark, i) => {
      const btn = document.createElement("button"); btn.className = "ttt-cell" + (mark === "O" ? " o" : "");
      btn.textContent = mark; btn.setAttribute("aria-label", `Cell ${i + 1}: ${mark || "empty"}`);
      btn.disabled = !!mark || ended || busy; btn.addEventListener("click", () => humanMove(i));
      $("tttBoard").appendChild(btn);
    });
  }
  function finish(text, win = false) {
    ended = true; $("tttStatus").textContent = text;
    if (win) { window.ArcadeStorage.increment("tttWins"); window.ArcadeApp.refreshRecords(); }
    drawBoard();
  }
  function humanMove(i) {
    if (ended || busy || board[i]) return;
    board[i] = "X";
    if (winner(board, "X")) { drawBoard(); finish("YOU WIN! Nice move.", true); window.ArcadeApp.toast("PLAYER 1 WINS!"); return; }
    if (board.every(Boolean)) { finish("DRAW GAME. Try again."); return; }
    busy = true; drawBoard(); $("tttStatus").textContent = "CPU is thinking...";
    setTimeout(() => {
      let move = board.findIndex((v, idx) => !v && wouldWin(idx, "O"));
      if (move < 0) move = board.findIndex((v, idx) => !v && wouldWin(idx, "X"));
      if (move < 0 && !board[4]) move = 4;
      if (move < 0) { const empty = board.map((v, idx) => v ? -1 : idx).filter(v => v >= 0); move = empty[Math.floor(Math.random() * empty.length)]; }
      if (move >= 0) board[move] = "O";
      busy = false;
      if (winner(board, "O")) { drawBoard(); finish("CPU WINS. Rematch?"); }
      else if (board.every(Boolean)) finish("DRAW GAME. Try again.");
      else { $("tttStatus").textContent = "Your turn — you are X."; drawBoard(); }
    }, 350);
  }
  function wouldWin(i, mark) { board[i] = mark; const result = winner(board, mark); board[i] = ""; return result; }
  function startTtt() { board = Array(9).fill(""); ended = false; busy = false; $("tttStatus").textContent = "You are X. The computer is O."; drawBoard(); $("currentScore").textContent = "0000"; }
  $("tttRestart").addEventListener("click", startTtt);
  window.ArcadeMiniGames = { startMemory, startTtt };
  startMemory(); startTtt();
})();