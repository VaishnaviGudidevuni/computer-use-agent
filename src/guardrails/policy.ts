export type ActionRisk = "safe" | "sensitive" | "risky";

export type GuardrailDecision = {
  allowed: boolean;
  risk: ActionRisk;
  reason: string;
};

const DEFAULT_ALLOWLIST = [
  "login",
  "search_member",
  "extract_member",
];

const RISKY_ACTIONS = [
  "create_sub_account",
  "transfer_money",
  "close_account",
  "submit_payment",
  "delete_account",
];

const SENSITIVE_ACTIONS = [
  "login",
];

export function checkAction(
  actionType: string,
  allowlist: string[] = DEFAULT_ALLOWLIST,
): GuardrailDecision {
  if (RISKY_ACTIONS.includes(actionType)) {
    return {
      allowed: allowlist.includes(actionType),
      risk: "risky",
      reason: allowlist.includes(actionType)
        ? "Risky action explicitly allowed by policy."
        : "Risky action is blocked by the configured allowlist.",
    };
  }

  if (SENSITIVE_ACTIONS.includes(actionType)) {
    return {
      allowed: allowlist.includes(actionType),
      risk: "sensitive",
      reason: allowlist.includes(actionType)
        ? "Sensitive action allowed by policy; secret values must remain runtime-only."
        : "Sensitive action is not included in the configured allowlist.",
    };
  }

  if (allowlist.includes(actionType)) {
    return {
      allowed: true,
      risk: "safe",
      reason: "Action is included in the configured allowlist.",
    };
  }

  return {
    allowed: false,
    risk: "safe",
    reason: "Action is not included in the configured allowlist.",
  };
}