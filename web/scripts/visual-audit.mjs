import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = process.env.OUT_DIR || "/tmp/gl-visual";
mkdirSync(OUT, { recursive: true });

const findings = [];
function note(level, area, message) {
  findings.push({ level, area, message });
  console.log(`[${level.toUpperCase()}] ${area}: ${message}`);
}

async function shot(page, name, { fullPage = false } = {}) {
  const path = join(OUT, `${name}.png`);
  await page.screenshot({ path, fullPage });
  console.log(`  shot ${path}`);
  return path;
}

async function mustSee(page, area, text, { exact = false } = {}) {
  const loc = page.getByText(text, { exact });
  if ((await loc.count()) === 0) {
    note("fail", area, `Missing text: ${text}`);
    return false;
  }
  note("ok", area, `Saw “${text}”`);
  return true;
}

async function mustNotSee(page, area, re) {
  const body = await page.locator("body").innerText();
  if (re.test(body)) {
    note("fail", area, `Leftover copy matching ${re}`);
    return false;
  }
  note("ok", area, `No leftover ${re}`);
  return true;
}

async function clickRole(page, area, role, name) {
  const loc = page.getByRole(role, { name });
  if ((await loc.count()) === 0) {
    note("fail", area, `Missing ${role} “${name}”`);
    return false;
  }
  await loc.first().click();
  note("ok", area, `Clicked ${role} “${name}”`);
  return true;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
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

  // 1. Landing
  console.log("\n=== Landing / ===");
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 60000 });
  await shot(page, "01-landing");
  const h1 = (await page.locator("h1").first().textContent()) ?? "";
  if (!h1.includes("already marked")) {
    note("fail", "landing", `Unexpected h1: ${h1}`);
  } else {
    note("ok", "landing", "Hero headline present");
  }
  await mustSee(page, "landing", "Start from your PDFs");
  await mustSee(page, "landing", "Open the desk");
  await mustNotSee(page, "landing", /\bAtlas\b|\bLibrary\b|Start session|Skip diagnostic/i);

  if (!(await clickRole(page, "landing", "link", /Open the desk/i))) {
    await page.goto(`${BASE}/app`, { waitUntil: "domcontentloaded", timeout: 60000 });
  }
  await page.waitForURL(/\/app\/?$/);
  await page.waitForTimeout(400);

  // 2. Desk
  console.log("\n=== Desk /app ===");
  await shot(page, "02-desk");
  await mustSee(page, "desk", "Desk", { exact: true });
  await mustSee(page, "desk", "Computer Networks");
  await mustSee(page, "desk", "Continue");
  await mustNotSee(page, "desk", /\bAtlas\b|Start session|Open atlas|Diagnostic/i);

  const continuePlate = page.locator('a[aria-labelledby="continue-heading"]');
  if ((await continuePlate.count()) === 0) {
    note("fail", "desk", "Continue plate is not a link");
    await page.goto(`${BASE}/app/courses/cn-kurose`, { waitUntil: "domcontentloaded", timeout: 60000 });
  } else {
    await continuePlate.first().click();
    note("ok", "desk", "Clicked continue plate");
  }
  await page.waitForURL(/\/app\/courses\/cn-kurose/);
  await page.waitForTimeout(400);
  await page.waitForTimeout(300);

  // 3. Today
  console.log("\n=== Today /app/courses/cn-kurose ===");
  await shot(page, "03-today");
  await mustSee(page, "today", "This sitting");
  await mustSee(page, "today", "Path");
  await mustSee(page, "today", "Show map");
  await mustSee(page, "today", "TCP basics");
  if ((await page.getByRole("link", { name: /Practice this|Start review|Resume lesson|Start lesson|Open lesson/i }).count()) === 0) {
    note("fail", "today", "Missing single next-lesson CTA");
  } else {
    note("ok", "today", "Single next-lesson CTA present");
  }
  if ((await page.locator(".react-flow").count()) > 0) {
    note("fail", "today", "Map is visible by default");
  } else {
    note("ok", "today", "Path list is the default");
  }
  await mustNotSee(page, "today", /\bAtlas\b|Start session|Open atlas/i);

  if (await clickRole(page, "today", "button", /Show map/i)) {
    await page.waitForTimeout(600);
    if ((await page.locator(".react-flow").count()) === 0) {
      note("fail", "today", "Map did not appear");
    } else {
      note("ok", "today", "Map toggle works");
    }
    await shot(page, "03b-today-map");
    await clickRole(page, "today", "button", /Show list/i);
  }

  // Sources
  console.log("\n=== Sources ===");
  if (!(await clickRole(page, "today", "link", /^Sources$/))) {
    await page.goto(`${BASE}/app/courses/cn-kurose/sources`, { waitUntil: "domcontentloaded", timeout: 60000 });
  }
  await page.waitForTimeout(400);
  await shot(page, "04-sources");
  await mustSee(page, "sources", "Sources");
  await mustSee(page, "sources", "Add PDF");

  // Progress
  console.log("\n=== Progress ===");
  if (!(await clickRole(page, "sources", "link", /^Progress$/))) {
    await page.goto(`${BASE}/app/courses/cn-kurose/insights`, { waitUntil: "domcontentloaded", timeout: 60000 });
  }
  await page.waitForTimeout(400);
  await shot(page, "05-progress");
  await mustSee(page, "progress", "Progress");
  await mustSee(page, "progress", "Needs attention");
  await mustNotSee(page, "progress", /\bInsights\b|\bAtlas\b/i);

  // Settings
  console.log("\n=== Settings ===");
  if (!(await clickRole(page, "progress", "link", /Settings/i))) {
    await page.goto(`${BASE}/app/settings`, { waitUntil: "domcontentloaded", timeout: 60000 });
  }
  await page.waitForTimeout(400);
  await shot(page, "06-settings");
  await mustSee(page, "settings", "Desk");
  await mustSee(page, "settings", "Lamp");
  await mustSee(page, "settings", "Sittings");
  await mustNotSee(page, "settings", /Dark paper|Atlas/i);

  const lamp = page.getByRole("radio", { name: /^Lamp$/ });
  if ((await lamp.count()) > 0) {
    await lamp.first().click();
    await page.waitForTimeout(200);
    const theme = await page.locator("html").getAttribute("data-theme");
    if (theme !== "dark") note("fail", "settings", `Lamp did not set dark, got ${theme}`);
    else note("ok", "settings", "Lamp theme applied");
    await shot(page, "06b-settings-lamp");
    await page.getByRole("radio", { name: /^Desk$/ }).first().click();
  }

  // New course
  console.log("\n=== New course ===");
  await page.goto(`${BASE}/app/courses/new`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await shot(page, "07-new");
  await mustSee(page, "new", "New course");
  await mustSee(page, "new", "Build the path");
  await mustSee(page, "new", "Drop PDFs or click to upload");

  // Confirm (activated sample)
  console.log("\n=== Confirm ===");
  await page.goto(`${BASE}/app/courses/cn-kurose/confirm`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await shot(page, "08-confirm");
  await mustSee(page, "confirm", "Review the path");
  await mustSee(page, "confirm", "Tracking on");
  if ((await page.getByRole("button", { name: /Already confirmed|Start tracking/i }).count()) > 0) {
    note("fail", "confirm", "Dead activate CTA still shown on an active course");
  } else {
    note("ok", "confirm", "No activate CTA on an already-tracked course");
  }

  // Diagnostic / placement
  console.log("\n=== Placement ===");
  await page.goto(`${BASE}/app/courses/cn-kurose/diagnostic`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(500);
  await shot(page, "09-placement");
  const skip = page.getByRole("button", { name: /Skip placement/i });
  if ((await skip.count()) > 0) {
    note("ok", "placement", "Skip placement present");
    await skip.first().click();
    await page.waitForURL(/\/app\/courses\/cn-kurose\/?$/);
    await page.waitForTimeout(500);
    note("ok", "placement", "Skip returned to Today");
  } else {
    const body = await page.locator("body").innerText();
    if (/No lessons to place|Placement applied|Open today/i.test(body)) {
      note("ok", "placement", "Placement empty/done state rendered");
    } else {
      note("fail", "placement", `Unexpected placement body: ${body.slice(0, 180)}`);
    }
  }

  // Today → lesson
  console.log("\n=== Lesson ===");
  await page.goto(`${BASE}/app/courses/cn-kurose`, { waitUntil: "domcontentloaded", timeout: 60000 });
  const lessonCta = page.getByRole("link", {
    name: /Practice this|Start review|Resume lesson|Start lesson|Open lesson/i,
  });
  if ((await lessonCta.count()) === 0) {
    note("fail", "lesson", "No primary lesson CTA");
    await page.goto(`${BASE}/app/courses/cn-kurose/lessons/l-tcp`, {
      waitUntil: "networkidle",
    });
  } else {
    await lessonCta.first().click();
  }
  await page.waitForURL(/\/lessons\//);
  await page.waitForFunction(() => {
    const h = document.querySelector("h1");
    return Boolean(h && h.textContent && h.textContent.trim().length > 0);
  }, null, { timeout: 15000 }).catch(() => {});
  await shot(page, "10-lesson");
  if ((await page.getByRole("link", { name: /^Today$/ }).count()) === 0) {
    note("fail", "lesson", "Missing Today back link");
  } else {
    note("ok", "lesson", "Today back link present");
  }
  const quizCta = page.getByRole("link", { name: /Take quiz/i });
  if ((await quizCta.count()) === 0) {
    note("warn", "lesson", "Quiz CTA not ready");
  } else {
    note("ok", "lesson", "Take quiz present");
    await quizCta.first().click();
    await page.waitForURL(/\/quiz/);
    await page.waitForTimeout(400);
    await shot(page, "11-quiz");
    if ((await page.getByRole("button", { name: /Check/i }).count()) === 0) {
      note("fail", "quiz", "Check button missing");
    } else {
      note("ok", "quiz", "Quiz interactive");
    }
    await clickRole(page, "quiz", "link", /Back to lesson/i);
  }

  // Sitting
  console.log("\n=== Sitting ===");
  await page.goto(`${BASE}/app/courses/cn-kurose/session`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(600);
  await shot(page, "12-sitting");
  const sittingBody = await page.locator("body").innerText();
  if (!/Sitting|Open lesson|Sitting complete/i.test(sittingBody)) {
    note("fail", "sitting", `Unexpected sitting body: ${sittingBody.slice(0, 180)}`);
  } else {
    note("ok", "sitting", "Sitting screen rendered");
  }
  if (await page.getByRole("button", { name: /End sitting/i }).count()) {
    await page.getByRole("button", { name: /End sitting/i }).click();
    await page.waitForTimeout(400);
    await shot(page, "12b-sitting-done");
    await mustSee(page, "sitting", "Sitting complete");
  }

  // 404
  console.log("\n=== 404 ===");
  await page.goto(`${BASE}/this-route-does-not-exist`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await shot(page, "13-404");
  await mustSee(page, "404", "Page not found");

  // Mobile
  console.log("\n=== Mobile ===");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 60000 });
  await shot(page, "m01-landing");
  await page.goto(`${BASE}/app`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await shot(page, "m02-desk");
  await page.goto(`${BASE}/app/courses/cn-kurose`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(300);
  await shot(page, "m03-today");
  const mobileNav = page.getByRole("navigation", { name: "Course" });
  if ((await mobileNav.count()) === 0) {
    note("fail", "mobile", "Course bottom island missing");
  } else {
    note("ok", "mobile", "Course bottom island present");
  }
  await page.goto(`${BASE}/app/courses/new`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await shot(page, "m04-new");
  await page.goto(`${BASE}/app/settings`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await shot(page, "m05-settings");

  const realConsole = consoleErrors.filter(
    (e) =>
      !/favicon|hydration|Download the React DevTools/i.test(e.text),
  );
  for (const e of realConsole) {
    note("warn", "console", `${e.url}: ${e.text.slice(0, 200)}`);
  }
  for (const e of pageErrors) {
    note("fail", "pageerror", `${e.url}: ${e.text.slice(0, 200)}`);
  }

  const fails = findings.filter((f) => f.level === "fail");
  const warns = findings.filter((f) => f.level === "warn");
  writeFileSync(
    join(OUT, "findings.json"),
    JSON.stringify({ findings, consoleErrors: realConsole, pageErrors }, null, 2),
  );
  console.log(
    `\n${findings.length} checks · ${fails.length} fail · ${warns.length} warn`,
  );
  await browser.close();
  if (fails.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
