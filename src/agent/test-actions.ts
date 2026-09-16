import { chromium } from "playwright";
import { executeAction } from "./actions";

async function main() {
  const browser = await chromium.launch({
    headless: false,
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("http://localhost:4000/login");

  console.log("Logging in...");

  await executeAction(page, {
    type: "login",
    username: "testuser",
    password: "testpass",
  });

  console.log("Login completed.");

  await page.waitForLoadState("networkidle");

  console.log("Searching for member 10001...");

  await executeAction(page, {
    type: "search_member",
    memberId: "10001",
  });

  console.log("Member search completed.");

  console.log("\nPage URL:", page.url());

  console.log("\nPage content:");
  console.log(await page.locator("body").innerText());

  await new Promise(() => {});
}

main().catch((error) => {
  console.error("Action test failed:");
  console.error(error);
});
