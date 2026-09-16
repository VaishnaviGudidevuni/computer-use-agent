
import { chromium } from "playwright";
import { askLLM } from "./llm";
import { executeAction, AllowedAction } from "./actions";
import { DiscoveryLogger } from "./discovery-log";
import fs from "fs";
import path from "path";

async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const logger = new DiscoveryLogger();

  const evidenceDir = path.join(process.cwd(), "evidence");
  fs.mkdirSync(evidenceDir, { recursive: true });

  const goal =
    "Look up member 10001 and return their current balance.";

  console.log("\n=== DISCOVERY AGENT ===");

  await page.goto("http://localhost:4000/login");

  for (let step = 1; step <= 5; step++) {
    const visibleText = await page.locator("body").innerText();

    console.log(`\n=== OBSERVATION ${step} ===`);
    console.log(visibleText);

    console.log("\n=== ASKING QWEN ===");

    const decisionText = await askLLM(
      goal,
      visibleText,
    );

    console.log("\n=== LLM DECISION ===");
    console.log(decisionText);

    let action: AllowedAction;

    try {
      action = JSON.parse(decisionText) as AllowedAction;
    } catch {
      throw new Error("Qwen returned invalid JSON.");
    }

    logger.add({
      step,
      observation: visibleText,
      decision: action,
      action: action.type,
      timestamp: new Date().toISOString(),
    });

    console.log("\n=== EXECUTING ACTION ===");
    console.log(action);

    if (action.type === "login") {
      await executeAction(page, {
        type: "login",
        username: "testuser",
        password: "testpass",
      });
    } else {
      const result = await executeAction(
        page,
        action,
      );

      if (result) {
        console.log("\n=== EXTRACTED RESULT ===");
        console.log(
          JSON.stringify(result, null, 2),
        );

        console.log("\n=== DISCOVERY SUCCESS ===");

        const evidencePath = logger.save();

        await page.screenshot({
          path: path.join(
            evidenceDir,
            "discovery-success.png",
          ),
          fullPage: true,
        });

        console.log("\n=== EVIDENCE SAVED ===");
        console.log(evidencePath);
        console.log(
          "evidence/discovery-success.png",
        );

        await browser.close();

        return;
      }
    }

    await page.waitForLoadState("networkidle");
  }

  await browser.close();

  throw new Error(
    "Discovery did not reach a successful result within 5 steps.",
  );
}

main().catch((error) => {
  console.error("\nDiscovery failed:");
  console.error(error);
  process.exit(1);
});