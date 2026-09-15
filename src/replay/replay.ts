import { Page, Locator } from "playwright";
import { Artifact } from "../artifact/schema";

export type ReplayResult =
  | {
      status: "success";
      outputs: Record<string, unknown>;
    }
  | {
      status: "business_outcome";
      outcome: string;
      outputs: Record<string, unknown>;
    }
  | {
      status: "recoverable";
      stepId: string;
      message: string;
    }
  | {
      status: "hard_failure";
      stepId: string;
      message: string;
    };

export class ReplayEngine {
  constructor(private readonly page: Page) {}

  async replay(
    artifact: Artifact,
    parameters: Record<string, unknown>,
  ): Promise<ReplayResult> {
    const outputs: Record<string, unknown> = {};

    let currentStepId = "unknown";

    try {
      this.validateParameters(
        artifact,
        parameters,
      );

      for (const step of artifact.steps) {
        currentStepId = step.id;

        console.log(
          `[REPLAY] ${step.id}: ${step.description}`,
        );

        switch (step.action) {
          case "navigate":
            await this.navigate(
              step.value,
              parameters,
            );
            break;

          case "click":
            await this.click(step.target);
            break;

          case "type":
            await this.type(
              step.target,
              step.value,
              parameters,
            );
            break;

          case "select":
            await this.select(
              step.target,
              step.value,
              parameters,
            );
            break;

          case "extract":
            await this.extract(
              step.target,
              step.output,
              outputs,
            );
            break;

          case "wait":
            await this.wait(step.value);
            break;

          default:
            throw new Error(
              `Unsupported action: ${step.action}`,
            );
        }

        if (step.checkpoint) {
          await this.verifyCheckpoint(
            step.checkpoint,
          );
        }
      }

      await this.verifySuccessCondition(
        artifact.successCondition,
        outputs,
      );

      console.log(
        "[REPLAY] Replay completed successfully.",
      );

      return {
        status: "success",
        outputs,
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : String(error);

      console.error(
        `[REPLAY ERROR] Step: ${currentStepId}`,
      );

      console.error(
        `[REPLAY ERROR] ${message}`,
      );

      if (
        message.includes("No member found")
      ) {
        return {
          status: "business_outcome",
          outcome: "member_not_found",
          outputs,
        };
      }

      return {
        status: "hard_failure",
        stepId: currentStepId,
        message,
      };
    }
  }

  private validateParameters(
    artifact: Artifact,
    parameters: Record<string, unknown>,
  ): void {
    for (const parameter of artifact.parameters) {
      const value =
        parameters[parameter.name];

      if (
        parameter.required &&
        (value === undefined ||
          value === null ||
          value === "")
      ) {
        throw new Error(
          `Missing required parameter: ${parameter.name}`,
        );
      }

      if (
        parameter.type === "number" &&
        typeof value !== "number"
      ) {
        throw new Error(
          `Parameter "${parameter.name}" must be a number.`,
        );
      }

      if (
        parameter.type === "boolean" &&
        typeof value !== "boolean"
      ) {
        throw new Error(
          `Parameter "${parameter.name}" must be a boolean.`,
        );
      }

      if (
        parameter.type === "string" &&
        typeof value !== "string"
      ) {
        throw new Error(
          `Parameter "${parameter.name}" must be a string.`,
        );
      }
    }
  }

  private async navigate(
    value: string | undefined,
    parameters: Record<string, unknown>,
  ): Promise<void> {
    if (!value) {
      throw new Error(
        "Navigate step is missing a URL.",
      );
    }

    const url = this.replaceParameters(
      value,
      parameters,
    );

    console.log(`[NAVIGATE] ${url}`);

    await this.page.goto(url, {
      waitUntil: "domcontentloaded",
    });
  }

  private async click(
    target?: Artifact["steps"][number]["target"],
  ): Promise<void> {
    const locator =
      await this.findTarget(target);

    await locator.click();
  }

  private async type(
    target: Artifact["steps"][number]["target"],
    value: string | undefined,
    parameters: Record<string, unknown>,
  ): Promise<void> {
    if (!value) {
      throw new Error(
        "Type step is missing a value.",
      );
    }

    const locator =
      await this.findTarget(target);

    const resolvedValue =
      this.replaceParameters(
        value,
        parameters,
      );

    await locator.fill(resolvedValue);

    console.log(
      `[TYPE] Entered value for parameterized field.`,
    );
  }

  private async select(
    target: Artifact["steps"][number]["target"],
    value: string | undefined,
    parameters: Record<string, unknown>,
  ): Promise<void> {
    if (!value) {
      throw new Error(
        "Select step is missing a value.",
      );
    }

    const locator =
      await this.findTarget(target);

    const resolvedValue =
      this.replaceParameters(
        value,
        parameters,
      );

    await locator.selectOption(
      resolvedValue,
    );
  }

  private async extract(
    target: Artifact["steps"][number]["target"],
    outputName: string | undefined,
    outputs: Record<string, unknown>,
  ): Promise<void> {
    if (!outputName) {
      throw new Error(
        "Extract step is missing an output name.",
      );
    }

    const locator =
      await this.findTarget(target);

    const text =
      await locator.textContent();

    const extractedValue =
      text?.trim() ?? "";

    outputs[outputName] =
      this.normalizeExtractedValue(
        outputName,
        extractedValue,
      );

    console.log(
      `[EXTRACT] ${outputName}: ${outputs[outputName]}`,
    );
  }

  private normalizeExtractedValue(
    outputName: string,
    value: string,
  ): unknown {
    if (
      outputName === "savingsBalance"
    ) {
      const cleaned = value
        .replace(/[$,]/g, "")
        .trim();

      const numberValue =
        Number(cleaned);

      if (!Number.isNaN(numberValue)) {
        return numberValue;
      }
    }

    return value;
  }

  private async wait(
    value?: string,
  ): Promise<void> {
    const milliseconds = Number(
      value ?? "1000",
    );

    if (
      Number.isNaN(milliseconds) ||
      milliseconds < 0
    ) {
      throw new Error(
        `Invalid wait duration: ${value}`,
      );
    }

    await this.page.waitForTimeout(
      milliseconds,
    );
  }

  private async findTarget(
    target?: Artifact["steps"][number]["target"],
  ): Promise<Locator> {
    if (!target) {
      throw new Error(
        "Step is missing a target.",
      );
    }

    const strategies = [
      target,
      ...(target.fallback ?? []),
    ];

    let lastError: unknown;

    for (const strategy of strategies) {
      try {
        console.log(
          `[LOCATOR] Trying ${strategy.type}: ${strategy.value}`,
        );

        switch (strategy.type) {
          case "role": {
            const parts =
              strategy.value.split(":");

            const role = parts[0];
            const name =
              parts.slice(1).join(":");

            if (
              role === "button" &&
              name
            ) {
              return this.page.getByRole(
                "button",
                {
                  name,
                },
              );
            }

            return this.page.getByRole(
              role as any,
            );
          }

          case "text":
            return this.page.getByText(
              strategy.value,
            );

          case "label":
            return this.page.getByLabel(
              strategy.value,
            );

          case "css":
            return this.page.locator(
              strategy.value,
            );

          case "xpath":
            return this.page.locator(
              `xpath=${strategy.value}`,
            );

          case "iframe":
            throw new Error(
              "Iframe targets are not supported by this replay version.",
            );

          default:
            throw new Error(
              `Unsupported locator type: ${strategy.type}`,
            );
        }
      } catch (error) {
        lastError = error;
      }
    }

    throw new Error(
      `Could not find target. Last error: ${String(
        lastError,
      )}`,
    );
  }

  private async verifyCheckpoint(
    checkpoint: string,
  ): Promise<void> {
    console.log(
      `[CHECKPOINT] ${checkpoint}`,
    );

    if (
      checkpoint.includes(
        "Member Search",
      )
    ) {
      await this.page
        .getByText("Member Search", {
          exact: true,
        })
        .waitFor({
          state: "visible",
          timeout: 5000,
        });

      console.log(
        "[CHECKPOINT PASSED] Member Search page is visible.",
      );

      return;
    }

    if (
      checkpoint.includes(
        "Member search result",
      )
    ) {
      await this.page.waitForURL(
        /\/members\/\d+/,
        {
          timeout: 5000,
        },
      );

      console.log(
        "[CHECKPOINT PASSED] Member details page is open.",
      );

      return;
    }

    if (
      checkpoint.includes(
        "Savings balance",
      ) ||
      checkpoint.includes(
        "Current balance",
      )
    ) {
      await this.page
        .getByText(
          "Current Balance",
          {
            exact: true,
          },
        )
        .waitFor({
          state: "visible",
          timeout: 5000,
        });

      console.log(
        "[CHECKPOINT PASSED] Current balance is visible.",
      );

      return;
    }

    console.log(
      `[CHECKPOINT] No specific verification rule for: ${checkpoint}`,
    );
  }

  private async verifySuccessCondition(
    condition: string,
    outputs: Record<string, unknown>,
  ): Promise<void> {
    console.log(
      `[SUCCESS CHECK] ${condition}`,
    );

    if (
      condition.includes(
        "current balance",
      ) ||
      condition.includes(
        "savings balance",
      )
    ) {
      await this.page
        .getByText(
          "Current Balance",
          {
            exact: true,
          },
        )
        .waitFor({
          state: "visible",
          timeout: 5000,
        });

      if (
        outputs.savingsBalance ===
          undefined ||
        outputs.savingsBalance === ""
      ) {
        throw new Error(
          "Success condition failed: savings balance was not extracted.",
        );
      }

      console.log(
        "[SUCCESS CHECK PASSED] Current balance was extracted.",
      );

      return;
    }

    await this.page.waitForLoadState(
      "domcontentloaded",
    );
  }

  private replaceParameters(
    value: string,
    parameters: Record<string, unknown>,
  ): string {
    return value.replace(
      /\{\{(\w+)\}\}/g,
      (_match, name: string) => {
        const parameter =
          parameters[name];

        if (
          parameter === undefined
        ) {
          return `{{${name}}}`;
        }

        return String(parameter);
      },
    );
  }
}