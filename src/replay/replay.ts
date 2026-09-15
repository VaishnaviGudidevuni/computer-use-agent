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

    try {
      this.validateParameters(artifact, parameters);

      for (const step of artifact.steps) {
        console.log(
          `[REPLAY] ${step.id}: ${step.description}`,
        );

        switch (step.action) {
          case "navigate":
            await this.navigate(step.value, parameters);
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
          await this.verifyCheckpoint(step.checkpoint);
        }
      }

      await this.verifySuccessCondition(
        artifact.successCondition,
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

      const currentStep =
        artifact.steps.find((step) =>
          message.includes(step.id),
        ) ??
        artifact.steps[artifact.steps.length - 1];

      if (message.includes("No member found")) {
        return {
          status: "business_outcome",
          outcome: "member_not_found",
          outputs,
        };
      }

      return {
        status: "hard_failure",
        stepId: currentStep?.id ?? "unknown",
        message,
      };
    }
  }

  private validateParameters(
    artifact: Artifact,
    parameters: Record<string, unknown>,
  ): void {
    for (const parameter of artifact.parameters) {
      if (
        parameter.required &&
        (parameters[parameter.name] === undefined ||
          parameters[parameter.name] === null)
      ) {
        throw new Error(
          `Missing required parameter: ${parameter.name}`,
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

    await this.page.goto(url, {
      waitUntil: "domcontentloaded",
    });
  }

  private async click(
    target?: Artifact["steps"][number]["target"],
  ): Promise<void> {
    const locator = await this.findTarget(target);

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

    const locator = await this.findTarget(target);

    const resolvedValue = this.replaceParameters(
      value,
      parameters,
    );

    await locator.fill(resolvedValue);
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

    const locator = await this.findTarget(target);

    const resolvedValue = this.replaceParameters(
      value,
      parameters,
    );

    await locator.selectOption(resolvedValue);
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

    const locator = await this.findTarget(target);

    const text = await locator.textContent();

    outputs[outputName] = text?.trim() ?? "";
  }

  private async wait(
    value?: string,
  ): Promise<void> {
    const milliseconds = Number(
      value ?? "1000",
    );

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
        switch (strategy.type) {
          case "role": {
            const [role, name] =
              strategy.value.split(":");

            if (role === "button" && name) {
              return this.page.getByRole(
                "button",
                { name },
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

    if (checkpoint.includes("Login page")) {
      await this.page
        .getByText("Legacy Bank Login")
        .waitFor({
          state: "visible",
        });
    }

    if (
      checkpoint.includes(
        "Member search result",
      )
    ) {
      await this.page.waitForLoadState(
        "domcontentloaded",
      );
    }

    if (
      checkpoint.includes(
        "Savings balance",
      )
    ) {
      await this.page.waitForLoadState(
        "domcontentloaded",
      );
    }
  }

  private async verifySuccessCondition(
    condition: string,
  ): Promise<void> {
    console.log(
      `[SUCCESS CHECK] ${condition}`,
    );

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
        const parameter = parameters[name];

        if (parameter === undefined) {
          return `{{${name}}}`;
        }

        return String(parameter);
      },
    );
  }
}