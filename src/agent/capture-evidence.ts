import { chromium } from "playwright";
import fs from "fs";
import path from "path";

async function main() {
  const browser = await chromium.launch({
    headless: false,
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  const evidenceDir = path.join(process.cwd(), "evidence");

  fs.mkdirSync(evidenceDir, {
    recursive: true,
  });

  console.log("Opening banking application...");

  await page.goto("http://localhost:4000/login");

  console.log("Logging in...");

  await page.locator('input[name="username"]').fill("testuser");
  await page.locator('input[name="password"]').fill("testpass");

  await page
    .locator('input[type="submit"][value="Log In"]')
    .click();

  await page.waitForLoadState("networkidle");

  console.log("Searching for member 10001...");

  await page.locator('input[name="memberId"]').fill("10001");

  await page
    .locator('input[type="submit"][value="Search"]')
    .click();

  await page.waitForLoadState("networkidle");

  console.log("Capturing evidence...");

  // Screenshot of the successful result.
  await page.screenshot({
    path: path.join(
      evidenceDir,
      "successful-member-balance.png",
    ),
    fullPage: true,
  });

  // DOM snapshot of the successful result.
  const html = await page.content();

  fs.writeFileSync(
    path.join(
      evidenceDir,
      "successful-member-balance.html",
    ),
    html,
    "utf-8",
  );

  // Human-readable text observation.
  const visibleText = await page.locator("body").innerText();

  fs.writeFileSync(
    path.join(
      evidenceDir,
      "successful-member-balance.txt",
    ),
    visibleText,
    "utf-8",
  );

  console.log("\n=== EVIDENCE CAPTURED ===");
  console.log("Screenshot: evidence/successful-member-balance.png");
  console.log("DOM:        evidence/successful-member-balance.html");
  console.log("Text:       evidence/successful-member-balance.txt");

  console.log("\n=== RESULT ===");
  console.log(visibleText);

  await browser.close();
}

main().catch((error) => {
  console.error("Evidence capture failed:");
  console.error(error);
  process.exit(1);
});