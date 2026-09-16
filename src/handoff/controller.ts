export type HandoffState =
  | "agent_running"
  | "paused_for_human"
  | "human_control"
  | "resumed"
  | "completed";

export type HandoffReason =
  | "risky_action"
  | "agent_uncertain"
  | "repeated_failure"
  | "human_requested";

export class HandoffController {
  private state: HandoffState = "agent_running";

  getState(): HandoffState {
    return this.state;
  }

  requestHandoff(reason: HandoffReason): void {
    this.state = "paused_for_human";

    console.log("\n=== HUMAN HANDOFF ===");
    console.log(`Reason: ${reason}`);
    console.log("Agent state: PAUSED");
    console.log(
      "Browser session remains active for human inspection."
    );
  }

  takeHumanControl(): void {
    if (this.state !== "paused_for_human") {
      throw new Error(
        "Human control can only begin after the agent is paused."
      );
    }

    this.state = "human_control";

    console.log("\n[HANDOFF] Human operator has control.");
  }

  resumeAgent(): void {
    if (this.state !== "human_control") {
      throw new Error(
        "Agent can only resume after human control."
      );
    }

    this.state = "resumed";

    console.log("\n[HANDOFF] Agent resumed.");
  }

  complete(): void {
    this.state = "completed";

    console.log("\n[HANDOFF] Workflow completed.");
  }
}