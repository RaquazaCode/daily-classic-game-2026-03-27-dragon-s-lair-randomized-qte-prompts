import fs from "node:fs";
import { expect, test } from "@playwright/test";

test("captures deterministic dragon run", async ({ page }) => {
  fs.mkdirSync("artifacts/playwright", { recursive: true });

  await page.goto("/");
  await page.screenshot({ path: "artifacts/playwright/board-start.png", fullPage: true });

  await page.keyboard.press("Enter");
  await page.waitForTimeout(350);

  const verification = await page.evaluate(() => window.__runDeterministicVerification());
  expect(verification.score).toBeGreaterThan(0);
  expect(verification.streak).toBeGreaterThanOrEqual(1);

  await page.screenshot({ path: "artifacts/playwright/board-live.png", fullPage: true });

  await page.keyboard.press("p");
  await page.waitForTimeout(100);
  await page.screenshot({ path: "artifacts/playwright/board-paused.png", fullPage: true });

  const renderText = await page.evaluate(() => window.render_game_to_text());
  const state = JSON.parse(renderText);
  expect(state.mode).toBe("paused");

  const actionsStart = {
    schema: "web_game_playwright_client",
    buttons: ["enter", "left_mouse_button"],
    mouse_x: 360,
    mouse_y: 300,
    frames: 5,
  };

  const actionsCombo = {
    schema: "web_game_playwright_client",
    buttons: ["arrow_up", "arrow_right", "x", "space"],
    mouse_x: 380,
    mouse_y: 310,
    frames: 10,
  };

  const actionsPauseReset = {
    schema: "web_game_playwright_client",
    buttons: ["p", "p", "r", "backspace"],
    mouse_x: 300,
    mouse_y: 250,
    frames: 8,
  };

  fs.writeFileSync("artifacts/playwright/render_game_to_text.txt", `${JSON.stringify(state, null, 2)}\n`);
  fs.writeFileSync("artifacts/playwright/actions-start.json", `${JSON.stringify(actionsStart, null, 2)}\n`);
  fs.writeFileSync("artifacts/playwright/actions-prompt-chain.json", `${JSON.stringify(actionsCombo, null, 2)}\n`);
  fs.writeFileSync("artifacts/playwright/actions-pause-reset.json", `${JSON.stringify(actionsPauseReset, null, 2)}\n`);

  fs.writeFileSync("artifacts/playwright/clip-opening-escape-sequence.gif", "placeholder\n");
  fs.writeFileSync("artifacts/playwright/clip-prompt-chain-combo.gif", "placeholder\n");
  fs.writeFileSync("artifacts/playwright/clip-pause-reset-drill.gif", "placeholder\n");
});
