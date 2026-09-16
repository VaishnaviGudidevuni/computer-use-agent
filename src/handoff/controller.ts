import fs from "fs";
import path from "path";

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

export type HandoffContext = {
  goal: string;
  currentStep: string;
  reason: HandoffReason;
  currentUrl: string;
};

export type HandoffEvidence = {
  goal: string;
  currentStep: string;
  reason: HandoffReason;
  stateBeforeHandoff: HandoffState;
  stateAfterHandoff: HandoffState;
  humanControlStartedAt?: string;
  humanControlEndedAt?: string;
  resumedAt?: string;
  completedAt?: string;
  urlBeforeHandoff: string;
  urlAfterHumanIntervention?: string;
};

export class HandoffController {
  private state: HandoffState = "agent_running";

  private evidence: HandoffEvidence | null = null;

  getState(): HandoffState {
    return this.state;
  }

  requestHandoff(
    context: HandoffContext,
  ): void {
    const previousState = this.state;

    this.state = "paused_for_human";

    this.evidence = {
      goal: context.goal,
      currentStep: context.currentStep,
      reason: context.reason,
      stateBeforeHandoff: previousState,
      stateAfterHandoff: this.state,
      urlBeforeHandoff: context.currentUrl,
    };

    console.log("\n=== HUMAN HANDOFF ===");
    console.log(`Goal: ${context.goal}`);
    console.log(`Current step: ${context.currentStep}`);
    console.log(`Reason: ${context.reason}`);
    console.log("Agent state: PAUSED");
    console.log(
      "Browser session remains active for human inspection.",
    );
  }

  takeHumanControl(
    currentUrl: string,
  ): void {
    if (
      this.state !==
      "paused_for_human"
    ) {
      throw new Error(
        "Human control can only begin after the agent is paused.",
      );
    }

    this.state = "human_control";

    if (this.evidence) {
      this.evidence.humanControlStartedAt =
        new Date().toISOString();
    }

    console.log(
      "\n[HANDOFF] Human operator has control.",
    );
    console.log(
      `Current browser URL: ${currentUrl}`,
    );
  }

  recordHumanIntervention(
    currentUrl: string,
  ): void {
    if (
      this.state !==
      "human_control"
    ) {
      throw new Error(
        "Human intervention can only be recorded while the human has control.",
      );
    }

    if (this.evidence) {
      this.evidence.humanControlEndedAt =
        new Date().toISOString();

      this.evidence.urlAfterHumanIntervention =
        currentUrl;
    }

    console.log(
      "[HANDOFF] Human intervention recorded.",
    );
  }

  resumeAgent(): void {
    if (
      this.state !==
      "human_control"
    ) {
      throw new Error(
        "Agent can only resume after human control.",
      );
    }

    this.state = "resumed";

    if (this.evidence) {
      this.evidence.resumedAt =
        new Date().toISOString();
    }

    console.log(
      "\n[HANDOFF] Agent resumed.",
    );
  }

  complete(): void {
    this.state = "completed";

    if (this.evidence) {
      this.evidence.completedAt =
        new Date().toISOString();
    }

    this.saveEvidence();

    console.log(
      "\n[HANDOFF] Workflow completed.",
    );
  }

  private saveEvidence(): void {
    if (!this.evidence) {
      return;
    }

    const evidenceDir = path.join(
      process.cwd(),
      "evidence",
      "handoff",
    );

    fs.mkdirSync(
      evidenceDir,
      { recursive: true },
    );

    const timestamp =
      new Date()
        .toISOString()
        .replace(/[:.]/g, "-");

    const evidencePath =
      path.join(
        evidenceDir,
        `handoff-${timestamp}.json`,
      );

    fs.writeFileSync(
      evidencePath,
      JSON.stringify(
        this.evidence,
        null,
        2,
      ),
      "utf8",
    );

    console.log(
      `[EVIDENCE] Handoff evidence saved: ${evidencePath}`,
    );
  }
}