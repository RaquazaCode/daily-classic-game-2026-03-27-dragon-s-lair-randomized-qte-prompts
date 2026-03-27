import {
  advanceTime,
  createInitialState,
  handleInput,
  renderStateToText,
  snapshotState,
} from "./game-core.js";

const state = createInitialState();
const hudEl = document.querySelector("#hud");
const promptEl = document.querySelector("#prompt");
const logEl = document.querySelector("#log");

function render() {
  const view = snapshotState(state);

  hudEl.innerHTML = "";
  const stats = [
    ["Mode", view.mode],
    ["Score", String(view.score)],
    ["Lives", String(view.lives)],
    ["Streak", String(view.streak)],
  ];

  for (const [label, value] of stats) {
    const node = document.createElement("div");
    node.innerHTML = `<strong>${label}</strong><br>${value}`;
    hudEl.appendChild(node);
  }

  if (view.activePrompt) {
    promptEl.innerHTML = `
      <div>
        <div>Incoming hazard: press</div>
        <div class="key">${view.activePrompt.label}</div>
        <div class="timer">${Math.max(0, view.activePrompt.remainingMs)} ms left</div>
      </div>
    `;
  } else {
    let message = "Press Enter to start.";
    if (view.mode === "running") message = "Hold your nerve. Next hazard incoming...";
    if (view.mode === "paused") message = "Paused. Press P to resume.";
    if (view.mode === "game_over") message = "Game over. Press R to restart.";
    promptEl.innerHTML = `<div>${message}</div>`;
  }

  const items = [view.lastOutcome, ...view.history].slice(0, 5);
  logEl.innerHTML = items.map((item, index) => `${index + 1}. ${item}`).join("<br>");
}

document.addEventListener("keydown", (event) => {
  const key = event.key;
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " ", "Backspace"].includes(key)) {
    event.preventDefault();
  }
  handleInput(state, key);
  render();
});

let raf = 0;
let lastTick = performance.now();

function loop(now) {
  const delta = now - lastTick;
  lastTick = now;
  advanceTime(state, delta);
  render();
  raf = requestAnimationFrame(loop);
}

raf = requestAnimationFrame(loop);

window.advanceTime = (ms) => {
  advanceTime(state, ms);
  render();
  return snapshotState(state);
};

window.render_game_to_text = () => renderStateToText(state);

window.__runDeterministicVerification = () => {
  const probe = createInitialState();
  handleInput(probe, "Enter");

  const outcomes = [];
  for (let i = 0; i < 4; i += 1) {
    advanceTime(probe, 1900);
    if (!probe.activePrompt) {
      outcomes.push("no_prompt");
      continue;
    }
    const expected = probe.activePrompt.key;
    handleInput(probe, expected === "KeyX" ? "x" : expected === "Space" ? " " : expected);
    outcomes.push(expected);
  }

  return {
    score: probe.score,
    streak: probe.streak,
    lives: probe.lives,
    outcomes,
    render: JSON.parse(renderStateToText(probe)),
  };
};

window.addEventListener("beforeunload", () => cancelAnimationFrame(raf));
render();
