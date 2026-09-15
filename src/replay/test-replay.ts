import * as fs from "fs";
import { chromium } from "playwright";
import { ArtifactSchema } from "../artifact/schema";
import { ReplayEngine } from "./replay";

async function main() {
  const raw = fs.readFileSync(
    "artifacts/lookup-member-balance.json",
    "utf-8",
  );

  const data = JSON.parse(raw);

  const result = ArtifactSchema.safeParse(data);

  if (!result.success) {
    console.error("Artifact validation failed.");

    for (const issue of result.error.issues) {
      console.error(
        `- ${issue.path.join(".")}: ${issue.message}`,
      );
    }

    process.exit(1);
  }

  const artifact = result.data;

  console.log(
    `Loaded artifact: ${artifact.name} v${artifact.version}`,
  );

  const browser = await chromium.launch({
    headless: false,
  });

  const context = await browser.newContext();

  const page = await context.newPage();

  try {
    const replayEngine = new ReplayEngine(page);

    const replayResult = await replayEngine.replay(
      artifact,
      {
        memberId: "10001"
      },
    );

    console.log("\nReplay result:");
    console.log(
      JSON.stringify(replayResult, null, 2),
    );

    console.log(
      "\nBrowser will stay open for inspection.",
    );

    // Keep browser open.
    await new Promise(() => {});
  } catch (error) {
    console.error("\nReplay test failed:");
    console.error(error);

    console.log(
      "\nBrowser will stay open for inspection.",
    );

    // Keep browser open even if replay fails.
    await new Promise(() => {});
  }
}

main().catch((error) => {
  console.error("Unexpected error:");
  console.error(error);
});