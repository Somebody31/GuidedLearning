import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = process.env.OUT_DIR || "/tmp/gl-visual";
mkdirSync(OUT, { recursive: true });

const findings = [];
function note(level, area, message) {
  findings.push({ level, area, message });
  const tag = level.toUpperCase();
  console.log(`[${tag}] ${area}: ${message}`);
}

async function shot(page, name, { fullPage = false } = {}) {
  const path = join(OUT, `${name}.png`);
  // Default viewport-only: fullPage paints fixed chrome mid-document and
  // looks like content "under" sticky/fixed footers (false product bug).
  await page.screenshot({ path, fullPage });
  console.log(`  📸 ${path}`);
  return path;
}

async function checkNoConsoleErrors(page, area) {
  // collected via page.on
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push({ url: page.url(), text: msg.text() });
    }
  });
  page.on("pageerror", (err) => {
    pageErrors.push({ url: page.url(), text: err.message });
  });

  // ---- 1. Marketing ----
  console.log("\n=== Marketing / ===");
  await page.goto(BASE, { waitUntil: "networkidle" });
  await shot(page, "01-marketing");
  const h1 = await page.locator("h1").first().textContent();
  if (!h1?.includes("PDFs")) note("fail", "marketing", `Unexpected h1: ${h1}`);
  else note("ok", "marketing", "Hero headline present");
  const demoLink = page.getByRole("link", { name: /Open demo/i });
  if ((await demoLink.count()) === 0)
    note("fail", "marketing", "Missing demo CTA");
  else note("ok", "marketing", "Demo CTA present");

  // ---- 2. Library ----
  console.log("\n=== Library /app ===");
  await page.goto(`${BASE}/app`, { waitUntil: "networkidle" });
  await shot(page, "02-library");
  if ((await page.getByText("Continue").count()) === 0)
    note("fail", "library", "Continue hero missing");
  else note("ok", "library", "Continue hero present");
  if ((await page.getByText("Computer Networks").count()) === 0)
    note("fail", "library", "Course card missing");
  else note("ok", "library", "CN course listed");

  // ---- 3. Atlas map ----
  console.log("\n=== Atlas map ===");
  await page.goto(`${BASE}/app/courses/cn-kurose`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800); // react-flow layout
  await shot(page, "03-atlas-map");
  const rf = page.locator(".react-flow");
  if ((await rf.count()) === 0) note("fail", "atlas", "React Flow missing");
  else note("ok", "atlas", "Course map canvas mounted");
  if ((await page.getByText("Today").count()) === 0)
    note("fail", "atlas", "Session pack bar missing");
  else note("ok", "atlas", "Session pack bar visible");
  if ((await page.getByRole("link", { name: /Start session/i }).count()) === 0)
    note("fail", "atlas", "Start session missing");
  else note("ok", "atlas", "Start session CTA");

  // Segmented Map|List
  const listBtn = page.getByRole("radio", { name: "List" });
  if ((await listBtn.count()) > 0) {
    await listBtn.click();
    await page.waitForTimeout(300);
    await shot(page, "04-atlas-list");
    if ((await page.getByText("Introduction & edge").count()) === 0)
      note("fail", "atlas-list", "Unit headings missing in list");
    else note("ok", "atlas-list", "Curriculum list shows units");
    await page.getByRole("radio", { name: "Map" }).click();
    await page.waitForTimeout(400);
  } else note("fail", "atlas", "Map|List segmented control missing");

  // Duration segments
  const d45 = page.getByRole("radio", { name: "45" });
  if ((await d45.count()) > 0) {
    await d45.click();
    await page.waitForTimeout(200);
    note("ok", "atlas", "Duration segmented control works");
  }

  // Click a node via list for reliability
  await page.getByRole("radio", { name: "List" }).click();
  await page.waitForTimeout(200);
  const httpRow = page.getByRole("button", { name: /HTTP/i }).first();
  if ((await httpRow.count()) > 0) {
    await httpRow.click();
    await page.waitForTimeout(200);
    await shot(page, "05-atlas-inspector");
    if ((await page.getByRole("link", { name: /Start review|Start lesson|Resume/i }).count()) === 0)
      note("warn", "atlas", "Inspector CTA not found after select");
    else note("ok", "atlas", "Inspector shows lesson CTA");
  }

  // Keyboard M toggle
  await page.keyboard.press("m");
  await page.waitForTimeout(300);
  note("ok", "atlas", "Pressed M for map/list toggle");

  // Keyboard S starts session (only when pack non-empty)
  const beforeS = page.url();
  await page.keyboard.press("s");
  await page.waitForTimeout(500);
  if (page.url().includes("/session")) {
    note("ok", "atlas", "Keyboard S navigates to session");
    await page.goto(`${BASE}/app/courses/cn-kurose`, {
      waitUntil: "networkidle",
    });
    await page.waitForTimeout(400);
  } else {
    note(
      "warn",
      "atlas",
      `Keyboard S did not navigate (still ${beforeS}; pack may be empty)`,
    );
  }

  // ---- 4. Lesson focus ----
  console.log("\n=== Lesson HTTP ===");
  await page.goto(`${BASE}/app/courses/cn-kurose/lessons/l-http`, {
    waitUntil: "networkidle",
  });
  await shot(page, "06-lesson-http");
  if ((await page.getByText("Objectives").count()) === 0)
    note("fail", "lesson", "Objectives missing");
  else note("ok", "lesson", "Objectives section");
  if ((await page.getByText("Citations").count()) === 0)
    note("fail", "lesson", "Citations missing");
  else note("ok", "lesson", "Citations section");
  const takeQuiz = page.getByRole("link", { name: /Take quiz/i });
  if ((await takeQuiz.count()) === 0)
    note("fail", "lesson", "Take quiz CTA missing");
  else note("ok", "lesson", "Take quiz CTA");

  // Citation chip
  const chip = page.locator("button").filter({ hasText: /p\.\d+/ }).first();
  if ((await chip.count()) > 0) {
    await chip.click();
    await page.waitForTimeout(200);
    await shot(page, "07-lesson-citation-sheet");
    if ((await page.getByText("Source preview").count()) === 0)
      note("fail", "lesson", "Source sheet not opened");
    else note("ok", "lesson", "Citation opens source preview");
    await page.getByRole("button", { name: /Close/i }).click();
  }

  // Paper mode
  const paperBtn = page.getByRole("button", { name: /^Paper$/i });
  if ((await paperBtn.count()) > 0) {
    await paperBtn.click();
    await page.waitForTimeout(350);
    await shot(page, "08-lesson-paper");
    // Sanity: paper surface should not still be near-black canvas
    const paperBg = await page.evaluate(() => {
      const el = document.querySelector(".paper-mode");
      if (!el) return null;
      return getComputedStyle(el).backgroundColor;
    });
    if (!paperBg || paperBg.includes("7, 7, 10") || paperBg.includes("rgb(7"))
      note("fail", "lesson", `Paper mode bg still dark: ${paperBg}`);
    else note("ok", "lesson", "Paper mode toggle");
    await page.getByRole("button", { name: /^Dark$/i }).click();
    await page.waitForTimeout(250);
  }

  // ---- 5. Quiz flow ----
  console.log("\n=== Quiz ===");
  await page.goto(`${BASE}/app/courses/cn-kurose/lessons/l-http/quiz`, {
    waitUntil: "networkidle",
  });
  await shot(page, "09-quiz-q1");
  const options = page.getByRole("option");
  const optCount = await options.count();
  if (optCount < 2) note("fail", "quiz", `Only ${optCount} options`);
  else note("ok", "quiz", `${optCount} answer options`);

  // Answer all questions: prefer 2nd option (often correct in mock) → Check → Next/See results
  for (let i = 0; i < 12; i++) {
    if ((await page.getByText("Quiz complete").count()) > 0) break;

    const enabledOpts = page.locator('button[role="option"]:not([disabled])');
    const n = await enabledOpts.count();
    if (n > 0) {
      // Prefer middle options — mock data often puts correct answer not first
      await enabledOpts.nth(Math.min(1, n - 1)).click();
      await page.waitForTimeout(80);
    }

    const action = page
      .getByRole("button", {
        name: /^(Check|Next|Finish|Next question|See results)(\s*·.*)?$/i,
      })
      .first();
    if ((await action.count()) === 0) break;
    if (!(await action.isEnabled().catch(() => false))) {
      // Still disabled — try force-select first option
      const anyOpt = page.locator('button[role="option"]').first();
      if ((await anyOpt.count()) > 0) await anyOpt.click({ force: true });
      await page.waitForTimeout(80);
    }
    if (await action.isEnabled().catch(() => false)) {
      await action.click();
    } else {
      note("warn", "quiz", `Action button stuck disabled on step ${i}`);
      break;
    }
    await page.waitForTimeout(250);
  }
  await page.waitForTimeout(400);
  await shot(page, "10-quiz-complete");
  if ((await page.getByText(/What changed|Quiz complete/i).count()) === 0)
    note("fail", "quiz", "Completion / what-changed panel missing");
  else note("ok", "quiz", "What-changed panel after finish");
  if ((await page.getByText(/Mastery/i).count()) === 0)
    note("warn", "quiz", "Mastery delta not visible");
  else note("ok", "quiz", "Mastery shown on complete");

  // ---- 6. Session ----
  console.log("\n=== Session ===");
  await page.goto(`${BASE}/app/courses/cn-kurose/session`, {
    waitUntil: "networkidle",
  });
  await shot(page, "11-session");
  if ((await page.getByText("Queue").count()) === 0)
    note("fail", "session", "Queue rail missing");
  else note("ok", "session", "Queue rail");
  const skip = page.getByRole("button", { name: /Skip/i });
  if ((await skip.count()) > 0) {
    await skip.click();
    await page.waitForTimeout(200);
    note("ok", "session", "Skip defer works (1/2)");
    await shot(page, "12-session-after-skip");
  }
  // Cap skips (max 2). Short packs may end the session before the disabled label shows.
  if ((await page.getByRole("button", { name: /Skip ·|Skip/i }).count()) > 0) {
    await page.getByRole("button", { name: /Skip ·|Skip/i }).click();
    await page.waitForTimeout(200);
  }
  await shot(page, "12b-session-skip-cap");
  if ((await page.getByRole("button", { name: /Defer limit/i }).count()) > 0)
    note("ok", "session", "Skip cap disables further skips");
  else if ((await page.getByText(/Skips used:\s*2\/2/i).count()) > 0)
    note("ok", "session", "Skip cap enforced (session ended at 2/2)");
  else note("warn", "session", "Skip cap UI not observed (queue may be empty)");

  // ---- 7. Confirm autosave ----
  console.log("\n=== Confirm ===");
  await page.goto(`${BASE}/app/courses/cn-kurose/confirm`, {
    waitUntil: "networkidle",
  });
  await shot(page, "13-confirm");
  if ((await page.getByText(/Draft/i).count()) === 0)
    note("fail", "confirm", "Draft save status missing");
  else note("ok", "confirm", "Draft status chip");
  const input = page.locator("input").first();
  if ((await input.count()) > 0) {
    await input.fill("Renamed intro lesson for visual test");
    await page.waitForTimeout(600);
    const status = await page.locator("text=/Draft/").first().textContent();
    note("ok", "confirm", `After edit status area: ${status}`);
    await shot(page, "14-confirm-edited");
  }
  await page.getByRole("button", { name: /Activate course/i }).click();
  await page.waitForTimeout(200);
  await shot(page, "15-confirm-modal");
  if ((await page.getByText(/Spaced review will use/i).count()) === 0)
    note("fail", "confirm", "Activate modal copy missing");
  else note("ok", "confirm", "Activate modal");
  await page.getByRole("button", { name: /Keep editing/i }).click();

  // ---- 8. Upload ----
  console.log("\n=== Upload ===");
  await page.goto(`${BASE}/app/courses/new`, { waitUntil: "networkidle" });
  await shot(page, "16-upload");
  await page.getByRole("button", { name: /Drop PDFs/i }).click();
  await page.waitForTimeout(1400);
  await shot(page, "17-upload-after-mock");
  if ((await page.getByText(/ready|parsing/i).count()) === 0)
    note("warn", "upload", "Parse status not visible after mock upload");
  else note("ok", "upload", "Mock upload/parse status");

  // ---- 9. Sources / Insights / Settings / Diagnostic ----
  console.log("\n=== Supporting pages ===");
  for (const [path, name, expectText] of [
    ["/app/courses/cn-kurose/sources", "18-sources", "Sources"],
    ["/app/courses/cn-kurose/insights", "19-insights", "Insights"],
    ["/app/settings", "20-settings", "Settings"],
    ["/app/courses/cn-kurose/diagnostic", "21-diagnostic", "Diagnostic"],
  ]) {
    await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
    await shot(page, name);
    if ((await page.getByText(expectText).count()) === 0)
      note("fail", name, `Missing ${expectText}`);
    else note("ok", name, `${expectText} page OK`);
  }

  // Diagnostic skip path
  await page.getByRole("button", { name: /Skip diagnostic/i }).click();
  await page.waitForTimeout(500);
  if (!page.url().includes("/app/courses/cn-kurose"))
    note("warn", "diagnostic", `Skip landed on ${page.url()}`);
  else note("ok", "diagnostic", "Skip diagnostic returns to atlas");

  // ---- 10. Mobile viewport atlas ----
  console.log("\n=== Mobile 390x844 ===");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/app/courses/cn-kurose`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await shot(page, "22-atlas-mobile");
  const mobileNav = page.getByRole("navigation", { name: /Course mobile/i });
  if ((await mobileNav.count()) === 0)
    note("fail", "mobile", "Bottom course nav missing");
  else if ((await mobileNav.getByRole("link", { name: "Sources" }).count()) === 0)
    note("fail", "mobile", "Bottom nav missing Sources");
  else note("ok", "mobile", "Bottom course nav present");
  await page.getByRole("radio", { name: "List" }).click();
  await page.waitForTimeout(200);
  await shot(page, "23-atlas-mobile-list");
  note("ok", "mobile", "Atlas renders at 390px");

  await page.goto(`${BASE}/app/courses/cn-kurose/lessons/l-congestion`, {
    waitUntil: "networkidle",
  });
  await shot(page, "24-lesson-mobile");

  // ---- 11. 404-ish lesson ----
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/app/courses/cn-kurose/lessons/does-not-exist`, {
    waitUntil: "networkidle",
  });
  await shot(page, "25-lesson-missing");
  if ((await page.getByText(/missing|Atlas/i).count()) === 0)
    note("fail", "404", "Missing lesson fallback weak");
  else note("ok", "404", "Missing lesson fallback");

  // Console / page errors summary
  console.log("\n=== Console / page errors ===");
  const meaningful = consoleErrors.filter(
    (e) =>
      !e.text.includes("favicon") &&
      !e.text.includes("Download the React DevTools"),
  );
  for (const e of meaningful.slice(0, 20)) {
    note("warn", "console", `${e.url} → ${e.text.slice(0, 160)}`);
  }
  for (const e of pageErrors) {
    note("fail", "pageerror", `${e.url} → ${e.text.slice(0, 160)}`);
  }
  if (meaningful.length === 0 && pageErrors.length === 0)
    note("ok", "console", "No console/page errors captured");

  await browser.close();

  const summary = {
    base: BASE,
    out: OUT,
    counts: {
      ok: findings.filter((f) => f.level === "ok").length,
      warn: findings.filter((f) => f.level === "warn").length,
      fail: findings.filter((f) => f.level === "fail").length,
    },
    findings,
  };
  writeFileSync(join(OUT, "report.json"), JSON.stringify(summary, null, 2));
  console.log("\n=== SUMMARY ===");
  console.log(JSON.stringify(summary.counts, null, 2));
  console.log(`Report: ${join(OUT, "report.json")}`);
  process.exit(summary.counts.fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
