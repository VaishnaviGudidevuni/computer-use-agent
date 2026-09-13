/**
 * VALIDATE AN ARTIFACT FILE
 * --------------------------
 * This is a small, standalone check: "does this saved recipe file
 * actually match the shape we defined in schema.ts?"
 *
 * Run it like this:
 *   npx ts-node src/artifact/validate.ts artifacts/lookup-member-balance.json
 *
 * Why this matters for the real project: before the replay engine
 * ever tries to run a recipe for real (clicking around a real bank
 * app), it should first confirm the recipe file is well-formed.
 * This catches mistakes early, with a clear error message, instead
 * of the robot failing halfway through a real run.
 */

import * as fs from "fs";
import { ArtifactSchema } from "./schema";

const filePath = process.argv[2];

if (!filePath) {
  console.error("Please provide a path to an artifact JSON file.");
  console.error("Example: npx ts-node src/artifact/validate.ts artifacts/lookup-member-balance.json");
  process.exit(1);
}

const raw = fs.readFileSync(filePath, "utf-8");
const data = JSON.parse(raw);

// .safeParse checks the data WITHOUT throwing an error if it's wrong —
// instead it hands back a clear result we can inspect ourselves.
const result = ArtifactSchema.safeParse(data);

if (result.success) {
  console.log(`✅ VALID artifact: "${result.data.name}" (id: ${result.data.id})`);
  console.log(`   Steps: ${result.data.steps.length}`);
  console.log(`   Parameters needed: ${result.data.parameters.map((p) => p.name).join(", ") || "(none)"}`);
  console.log(`   Outputs returned: ${result.data.outputs.map((o) => o.name).join(", ") || "(none)"}`);
} else {
  console.error(`❌ INVALID artifact file: ${filePath}`);
  console.error("Here is exactly what's wrong:");
  for (const issue of result.error.issues) {
    console.error(`  - at "${issue.path.join(".")}": ${issue.message}`);
  }
  process.exit(1);
}
