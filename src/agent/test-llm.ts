import { askLLM } from "./llm";

async function main() {
  const goal =
    "Look up member 10001 and return their current balance.";

  const observation = `
Member Search

Member ID:

Search
`;

  const decision = await askLLM(
    goal,
    observation,
  );

  console.log("\n=== LLM DECISION ===");
  console.log(decision);
  console.log("====================");
}

main().catch((error) => {
  console.error("LLM test failed:");
  console.error(error);
});
