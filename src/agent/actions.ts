import { Page } from "playwright";
import { checkAction } from "../guardrails/policy";

export type AllowedAction =
  | {
      type: "login";
      username: string;
      password: string;
    }
  | {
      type: "search_member";
      memberId: string;
    }
  | {
      type: "extract_member";
    };

export type MemberResult = {
  memberName: string;
  savingsBalance: number;
};

function enforceGuardrail(actionType: string): void {
  const decision = checkAction(actionType);

  console.log(
    `[GUARDRAIL] ${actionType}: ${decision.allowed ? "ALLOWED" : "BLOCKED"}`
  );

  console.log(`[GUARDRAIL] Risk: ${decision.risk}`);

  if (!decision.allowed) {
    throw new Error(
      `Action blocked by safety policy: ${actionType}. ${decision.reason}`
    );
  }
}

export async function executeAction(
  page: Page,
  action: AllowedAction,
): Promise<MemberResult | null> {
  // Check the safety policy before executing any action.
  enforceGuardrail(action.type);

  switch (action.type) {
    case "login": {
      const usernameInput = page.locator(
        'input[name="username"]',
      );

      const passwordInput = page.locator(
        'input[name="password"]',
      );

      const loginButton = page.locator(
        'input[type="submit"][value="Log In"]',
      );

      await usernameInput.waitFor({
        state: "visible",
        timeout: 10000,
      });

      await usernameInput.fill(action.username);

      await passwordInput.waitFor({
        state: "visible",
        timeout: 10000,
      });

      await passwordInput.fill(action.password);

      await loginButton.waitFor({
        state: "visible",
        timeout: 10000,
      });

      await loginButton.click({
        timeout: 10000,
      });

      // Never print or persist username/password values.
      console.log(
        "[ACTION] Login submitted using runtime credentials."
      );

      return null;
    }

    case "search_member": {
      const memberIdInput = page.locator(
        'input[name="memberId"]',
      );

      const searchButton = page.locator(
        'input[type="submit"][value="Search"]',
      );

      await memberIdInput.waitFor({
        state: "visible",
        timeout: 10000,
      });

      await memberIdInput.fill(action.memberId);

      await searchButton.waitFor({
        state: "visible",
        timeout: 10000,
      });

      await searchButton.click({
        timeout: 10000,
      });

      console.log(
        `[ACTION] Member search submitted for member ${action.memberId}.`
      );

      return null;
    }

    case "extract_member": {
      const memberName = (
        await page
          .locator(
            "//tr[td[1][normalize-space()='Name']]/td[2]",
          )
          .innerText()
      ).trim();

      const balanceText = (
        await page
          .locator(
            "//tr[td[1][normalize-space()='Current Balance']]/td[2]",
          )
          .innerText()
      ).trim();

      const savingsBalance = Number(
        balanceText.replace(/[$,]/g, ""),
      );

      if (Number.isNaN(savingsBalance)) {
        throw new Error(
          `Could not convert balance to a number: ${balanceText}`,
        );
      }

      console.log(
        "[ACTION] Member information extracted successfully."
      );

      return {
        memberName,
        savingsBalance,
      };
    }

    default:
      throw new Error("Action is not allowed.");
  }
}