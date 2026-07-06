Kids Game — Memory Match

Files:
- index.html — main game page
- styles.css — styling
- script.js — game logic

Open `index.html` in a browser to play. To deploy on GitHub Pages, push this folder to a repository named `Kids-Game` and enable Pages (branch: `main`, folder: `/`). If you prefer a single-file deploy, tell me and I'll inline CSS/JS into `index.html`.

QA Checklist
-----------

- Responsive 4x4 grid: resize the viewport (desktop → tablet → phone) and confirm 16 tiles are visible and square.
- Accessibility:
	- Tab to cards and press Enter/Space to flip.
	- Modal traps focus and closes with `Escape`.
	- Screen reader announces matches via live region.
- Performance:
	- Animations respect `prefers-reduced-motion`.
	- Confetti is reduced on low-power devices.

If you'd like, I can add automated visual tests (Playwright) or unit tests for the game logic. Which would you prefer?