export const constants = {
  STEP_MS: 100,
  PROMPT_INTERVAL_MS: 1800,
  PROMPT_TIMEOUT_MS: 1500,
  MAX_LIVES: 3,
  BASE_POINTS: 100,
  COMBO_BONUS: 20,
  SEED: 27032026,
};

const promptPool = [
  { key: "ArrowUp", label: "Arrow Up" },
  { key: "ArrowDown", label: "Arrow Down" },
  { key: "ArrowLeft", label: "Arrow Left" },
  { key: "ArrowRight", label: "Arrow Right" },
  { key: "Space", label: "Space" },
  { key: "KeyX", label: "X" },
];

const inputMap = new Map([
  [" ", "Space"],
  ["x", "KeyX"],
  ["X", "KeyX"],
  ["ArrowUp", "ArrowUp"],
  ["ArrowDown", "ArrowDown"],
  ["ArrowLeft", "ArrowLeft"],
  ["ArrowRight", "ArrowRight"],
]);

function nextSeed(seed) {
  return (seed * 1664525 + 1013904223) >>> 0;
}

function pickPrompt(state) {
  state.rngSeed = nextSeed(state.rngSeed);
  let index = state.rngSeed % promptPool.length;
  if (promptPool[index].key === state.lastPromptKey) {
    index = (index + 1) % promptPool.length;
  }
  return promptPool[index];
}

export function createInitialState() {
  return {
    mode: "idle",
    timeMs: 0,
    score: 0,
    streak: 0,
    lives: constants.MAX_LIVES,
    promptSerial: 0,
    nextPromptAtMs: constants.PROMPT_INTERVAL_MS,
    activePrompt: null,
    lastOutcome: "Awaiting start",
    history: [],
    rngSeed: constants.SEED,
    lastPromptKey: null,
  };
}

function pushHistory(state, message) {
  state.history.unshift(message);
  state.history = state.history.slice(0, 6);
}

function spawnPrompt(state) {
  const prompt = pickPrompt(state);
  state.promptSerial += 1;
  state.activePrompt = {
    id: state.promptSerial,
    key: prompt.key,
    label: prompt.label,
    remainingMs: constants.PROMPT_TIMEOUT_MS,
  };
  state.lastPromptKey = prompt.key;
  state.lastOutcome = `Prompt ${state.promptSerial} active`;
}

function applyFailure(state, reason) {
  state.lives -= 1;
  state.streak = 0;
  state.lastOutcome = reason;
  pushHistory(state, reason);
  state.activePrompt = null;
  state.nextPromptAtMs = state.timeMs + constants.PROMPT_INTERVAL_MS;
  if (state.lives <= 0) {
    state.mode = "game_over";
    state.lastOutcome = "Run failed: dragon wins";
    pushHistory(state, state.lastOutcome);
  }
}

function applySuccess(state) {
  state.streak += 1;
  const gained = constants.BASE_POINTS + constants.COMBO_BONUS * (state.streak - 1);
  state.score += gained;
  state.lastOutcome = `Success +${gained}`;
  pushHistory(state, state.lastOutcome);
  state.activePrompt = null;
  state.nextPromptAtMs = state.timeMs + constants.PROMPT_INTERVAL_MS;
}

export function startRun(state) {
  if (state.mode === "running") return;
  if (state.mode === "idle" || state.mode === "game_over") {
    const fresh = createInitialState();
    Object.assign(state, fresh);
  }
  state.mode = "running";
  state.lastOutcome = "Run started";
  pushHistory(state, state.lastOutcome);
}

export function restartRun(state) {
  Object.assign(state, createInitialState());
  state.mode = "running";
  state.lastOutcome = "Run restarted";
  pushHistory(state, state.lastOutcome);
}

export function resetToIdle(state) {
  Object.assign(state, createInitialState());
}

export function togglePause(state) {
  if (state.mode === "running") {
    state.mode = "paused";
    state.lastOutcome = "Paused";
    pushHistory(state, state.lastOutcome);
  } else if (state.mode === "paused") {
    state.mode = "running";
    state.lastOutcome = "Resumed";
    pushHistory(state, state.lastOutcome);
  }
}

export function handleInput(state, key) {
  if (key === "Enter") {
    startRun(state);
    return;
  }
  if (key === "p" || key === "P") {
    togglePause(state);
    return;
  }
  if (key === "r" || key === "R") {
    restartRun(state);
    return;
  }
  if (key === "Backspace") {
    resetToIdle(state);
    return;
  }

  if (state.mode !== "running" || !state.activePrompt) {
    return;
  }

  const normalized = inputMap.get(key);
  if (!normalized) {
    return;
  }

  if (normalized === state.activePrompt.key) {
    applySuccess(state);
  } else {
    applyFailure(state, `Missed: expected ${state.activePrompt.label}`);
  }
}

export function advanceTime(state, ms) {
  if (!Number.isFinite(ms) || ms <= 0) {
    return state;
  }

  let remaining = ms;
  while (remaining > 0) {
    const step = Math.min(constants.STEP_MS, remaining);
    remaining -= step;

    if (state.mode !== "running") {
      continue;
    }

    state.timeMs += step;

    if (!state.activePrompt && state.timeMs >= state.nextPromptAtMs) {
      spawnPrompt(state);
    }

    if (state.activePrompt) {
      state.activePrompt.remainingMs -= step;
      if (state.activePrompt.remainingMs <= 0) {
        applyFailure(state, `Timeout on ${state.activePrompt.label}`);
      }
    }
  }

  return state;
}

export function snapshotState(state) {
  return {
    mode: state.mode,
    timeMs: state.timeMs,
    score: state.score,
    streak: state.streak,
    lives: state.lives,
    lastOutcome: state.lastOutcome,
    activePrompt: state.activePrompt
      ? {
          id: state.activePrompt.id,
          key: state.activePrompt.key,
          label: state.activePrompt.label,
          remainingMs: state.activePrompt.remainingMs,
        }
      : null,
    history: [...state.history],
  };
}

export function renderStateToText(state) {
  return JSON.stringify(snapshotState(state), null, 2);
}
