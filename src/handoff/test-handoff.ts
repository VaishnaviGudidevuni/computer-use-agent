import { chromium } from "playwright";
import {
  HandoffController,
} from "./controller";
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
   * This is the SAME live browser session
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

  const goal =
    "Look up member 10001 and return their current balance.";

  const currentStep =
    "Waiting for human intervention.";

  const handoff =
    new HandoffController();

  console.log(
    `Initial state: ${handoff.getState()}`,
  );

  /*
   * Simulate the agent reaching a situation
   * where human intervention is required.
   */
  handoff.requestHandoff({
    goal,
    currentStep,
    reason: "agent_uncertain",
    currentUrl: page.url(),
  });

  console.log(
    `After handoff: ${handoff.getState()}`,
  );

  /*
   * Give the human control of the SAME
   * live browser session.
   */
  handoff.takeHumanControl(
    page.url(),
  );

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
   * Wait for the human to finish.
   */
  await waitForEnter(
    "\nPress ENTER when the human has finished their intervention and the agent may resume: ",
  );

  /*
   * Record the browser state after the
   * human intervention.
   */
  handoff.recordHumanIntervention(
    page.url(),
  );

  /*
   * Give control back to the automation agent.
   */
  handoff.resumeAgent();

  console.log(
    `After resume: ${handoff.getState()}`,
  );

  /*
   * The automation can continue using
   * the SAME page and browser session.
   */
  handoff.complete();

  console.log(
    `Final state: ${handoff.getState()}`,
  );

  await browser.close();
}

main().catch((error) => {
  console.error(
    "\nHandoff test failed:",
  );

  console.error(error);

  process.exit(1);
});