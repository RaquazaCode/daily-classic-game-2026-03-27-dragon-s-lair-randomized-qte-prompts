import assert from "node:assert/strict";
import {
  advanceTime,
  constants,
  createInitialState,
  handleInput,
  restartRun,
} from "../src/game-core.js";

{
  const state = createInitialState();
  handleInput(state, "Enter");
  assert.equal(state.mode, "running");

  advanceTime(state, constants.PROMPT_INTERVAL_MS + 10);
  assert.ok(state.activePrompt, "prompt should spawn");

  const expected = state.activePrompt.key;
  const key = expected === "KeyX" ? "x" : expected === "Space" ? " " : expected;
  handleInput(state, key);
  assert.equal(state.score, constants.BASE_POINTS);
  assert.equal(state.lives, constants.MAX_LIVES);
}

{
  const state = createInitialState();
  handleInput(state, "Enter");
  advanceTime(state, constants.PROMPT_INTERVAL_MS + constants.PROMPT_TIMEOUT_MS + 20);
  assert.equal(state.lives, constants.MAX_LIVES - 1, "timeout costs life");
}

{
  const state = createInitialState();
  restartRun(state);
  assert.equal(state.mode, "running");
  assert.equal(state.score, 0);
  assert.equal(state.lives, constants.MAX_LIVES);
}

console.log("game-core tests passed");
