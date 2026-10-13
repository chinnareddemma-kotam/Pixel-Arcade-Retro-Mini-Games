# Pixel Arcade

A responsive retro arcade website built with HTML5, CSS3, and vanilla JavaScript.

## Games
- **Pixel Snake:** Canvas 2D snake game. Arrow keys or WASD to move.
- **Memory Flip:** Match all eight pairs with as few moves as possible.
- **Reaction Rush:** Wait for green, then click quickly. Early clicks count as false starts.
- **Neon Tic-Tac-Toe:** Play X against a simple CPU that tries to win or block.

## Features
- Retro pixel-inspired interface, neon colors, scanline overlay, responsive layout.
- High scores and records saved in browser `localStorage`.
- Keyboard controls for Snake.
- Sound toggle with a tiny Web Audio API confirmation beep.
- No framework, package install, backend, or required third-party JavaScript library.

## Run locally
1. Extract the ZIP.
2. Open `index.html` in a browser, or open the folder in VS Code and use Live Server.
3. Optional: run `python -m http.server 8000` in this folder and visit `http://localhost:8000`.

Google Fonts are loaded from the internet; the page falls back to system monospace fonts when offline.

## Folder structure
```text
pixel-arcade/
├── index.html
├── README.md
├── css/
│   └── style.css
└── js/
    ├── app.js
    ├── storage.js
    ├── snake.js
    └── minigames.js
```

## Main JavaScript modules
- `storage.js`: one small API for reading, updating, and resetting local records.
- `snake.js`: canvas drawing, movement, food generation, collision detection, scoring.
- `minigames.js`: memory matching, reaction timer, and Tic-Tac-Toe CPU logic.
- `app.js`: navigation, launching/closing games, updating the score table, sound toggle.

## Notes
Records are stored only in the current browser profile. They are not online accounts or a shared leaderboard. Clearing browser site data or using another browser may remove or hide the records.
