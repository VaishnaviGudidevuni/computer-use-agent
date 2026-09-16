import { chromium } from "playwright";
import { askLLM } from "./llm";
import { executeAction, AllowedAction } from "./actions";

async function main() {
  const browser = await chromium.launch({
    headless: false,
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("http://localhost:4000/login");

  const goal =
    "Look up member 10001 and return their current balance.";

  console.log("\n=== DISCOVERY AGENT ===");

  for (let step = 1; step <= 5; step++) {
    const visibleText = await page.locator("body").innerText();

    console.log(`\n=== OBSERVATION ${step} ===`);
    console.log(visibleText);

    console.log("\n=== ASKING QWEN ===");

    const decisionText = await askLLM(goal, visibleText);

    console.log("\n=== LLM DECISION ===");
    console.log(decisionText);

    let action: AllowedAction;

    try {
      action = JSON.parse(decisionText) as AllowedAction;
    } catch {
      throw new Error("Qwen returned invalid JSON.");
    }

    console.log("\n=== EXECUTING ACTION ===");
    console.log(action);

    if (action.type === "login") {
      await executeAction(page, {
        type: "login",
        username: "testuser",
        password: "testpass",
      });
    } else {
      const result = await executeAction(page, action);

      if (result) {
        console.log("\n=== EXTRACTED RESULT ===");
        console.log(JSON.stringify(result, null, 2));

        console.log("\n=== DISCOVERY SUCCESS ===");
        break;
      }
    }

    await page.waitForLoadState("networkidle");
  }

  await new Promise(() => {});
}

main().catch((error) => {
  console.error("Discovery failed:");
  console.error(error);
});
