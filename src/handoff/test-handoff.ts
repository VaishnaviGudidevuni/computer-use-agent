import { chromium } from "playwright";
import { HandoffController } from "./controller";
import readline from "readline";

async function waitForEnter(
  message: string,
): Promise<void> {
  const rl =
    readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

  await new Promise<void>((resolve) => {
    rl.question(
      message,
      () => {
        rl.close();
        resolve();
      },
    );
  });
}

async function main() {
  /*
   * Start a visible browser.
   *
   * This represents the SAME live browser session
   * that the automation agent would be using.
   */
  const browser =
    await chromium.launch({
      headless: false,
    });

  const context =
    await browser.newContext();

  const page =
    await context.newPage();

  /*
   * Open the banking application.
   */
  await page.goto(
    "http://localhost:4000",
  );

  const handoff =
    new HandoffController();

  console.log(
    `Initial state: ${handoff.getState()}`,
  );

  /*
   * Simulate the agent reaching a situation
   * where human intervention is required.
   */
  handoff.requestHandoff(
    "agent_uncertain",
  );

  console.log(
    `After handoff: ${handoff.getState()}`,
  );

  /*
   * Transfer control to the human operator.
   */
  handoff.takeHumanControl();

  console.log(
    `Human control: ${handoff.getState()}`,
  );

  console.log(
    "\nThe live browser window is now available for the human operator.",
  );

  console.log(
    "The human can inspect or interact with the same browser session.",
  );

  /*
   * IMPORTANT:
   * Keep the browser open while the human is
   * interacting with the application.
   */
  await waitForEnter(
    "\nPress ENTER when the human has finished their intervention and the agent may resume: ",
  );

  /*
   * Give control back to the automation agent.
   */
  handoff.resumeAgent();

  console.log(
    `After resume: ${handoff.getState()}`,
  );

  /*
   * The automation can now continue using
   * the SAME page and browser session.
   */
  handoff.complete();

  console.log(
    `Final state: ${handoff.getState()}`,
  );

  /*
   * Close the browser after the workflow is complete.
   */
  await browser.close();
}

main().catch((error) => {
  console.error(
    "\nHandoff test failed:",
  );

  console.error(error);

  process.exit(1);
});