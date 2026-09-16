import { checkAction } from "./policy";

function testAction(actionType: string): void {
  const decision = checkAction(actionType);

  console.log(`\nAction: ${actionType}`);
  console.log(`Risk: ${decision.risk}`);
  console.log(`Allowed: ${decision.allowed}`);
  console.log(`Reason: ${decision.reason}`);
}

console.log("=== GUARDRAIL TEST ===");

testAction("search_member");
testAction("extract_member");
testAction("transfer_money");
testAction("create_sub_account");
testAction("delete_account");