/**
 * ARTIFACT SCHEMA
 * ----------------
 * An "artifact" is a saved recipe: a record of a task the AI robot
 * already figured out how to do once, written down in a strict,
 * predictable format so a completely separate (non-AI) program can
 * repeat it exactly, every time, without needing the AI again.
 *
 * We use a library called "zod" to describe the exact shape this
 * recipe must have. Zod lets us both:
 *   1) describe the shape (like a form template), and
 *   2) automatically check ("validate") whether some data actually
 *      matches that shape — very useful before we trust a recipe
 *      enough to run it for real.
 */

import { z } from "zod";

// ---------------------------------------------------------------
// LOCATOR — "how do I find the button/box I need to click or type into?"
// ---------------------------------------------------------------
// This is one of the most important design decisions in the whole
// project. Old, legacy websites often don't have nice labels for
// their buttons, so we need several "backup plans" for finding the
// right thing on screen. We try the first strategy; if that fails,
// we try the next one, and so on.
const LocatorSchema = z.object({
  // The main way we plan to find the element.
  strategy: z.enum([
    "role",      // find by its accessibility role + name (e.g. "the button named Submit") — most robust
    "testid",    // find by a developer-added test attribute — very robust, but legacy apps rarely have these
    "text",      // find by the visible text on screen (e.g. "Log In") — fairly robust, breaks if wording changes
    "css",       // find by a CSS selector (e.g. "#loginForm input[name=username]") — brittle, but sometimes the only option
    "xpath",     // find by an XPath expression — last resort, most brittle
  ]),
  value: z.string(), // the actual detail used by that strategy (e.g. the exact text, or the CSS selector)

  // Backup strategies to try, in order, if the main one fails.
  // Listing these explicitly is what makes replay "deterministic but
  // resilient" — small on-screen changes don't break the whole recipe.
  fallbacks: z
    .array(
      z.object({
        strategy: z.enum(["role", "testid", "text", "css", "xpath"]),
        value: z.string(),
      })
    )
    .default([]),
});

// ---------------------------------------------------------------
// CHECKPOINT — "how do I know the click actually worked?"
// ---------------------------------------------------------------
// A checkpoint is a small, specific check performed right after a
// step, to confirm we actually reached the state we expected —
// instead of blindly assuming the click succeeded and charging
// ahead (which is how automation quietly breaks in production).
const CheckpointSchema = z.object({
  type: z.enum([
    "elementVisible",   // some specific element must now be visible
    "urlContains",      // the web address must now contain some text
    "textVisible",      // some specific text must now be visible on screen
  ]),
  expected: z.string(), // what we're actually checking for
});

// ---------------------------------------------------------------
// STEP — one single action in the recipe (one click, one typed value, etc.)
// ---------------------------------------------------------------
const StepSchema = z.object({
  id: z.string(),          // a short unique label for this step, e.g. "step_1"
  description: z.string(), // plain-English note on what this step does (helps a human reviewer)

  action: z.enum([
    "navigate", // go to a specific web address
    "click",    // click something
    "type",     // type text into something
    "waitFor",  // pause until some condition is true (e.g. page finished loading)
    "extract",  // read a piece of data off the screen (e.g. the balance)
  ]),

  // Only relevant for "click", "type", "waitFor", "extract" —
  // navigate doesn't need to find an element, it just goes to a URL.
  locator: LocatorSchema.optional(),

  // For "navigate": the URL to go to.
  // For "type": the text to type — this can literally be typed text,
  //             OR a reference to a parameter name (see ParameterSchema
  //             below), so the same recipe can be reused with different
  //             inputs each time (e.g. a different member ID each run).
  value: z.string().optional(),

  // For "extract": what name to save the extracted data under, so
  // it can later be returned as one of the artifact's "outputs".
  extractAs: z.string().optional(),

  // An optional check confirming this step actually worked before
  // moving to the next one.
  checkpoint: CheckpointSchema.optional(),
});

// ---------------------------------------------------------------
// PARAMETER — an input the artifact needs each time it's run
// ---------------------------------------------------------------
// Example: "memberId" — different every time you replay this recipe.
const ParameterSchema = z.object({
  name: z.string(),
  type: z.enum(["string", "number", "boolean"]),
  required: z.boolean().default(true),
  description: z.string().optional(),
});

// ---------------------------------------------------------------
// OUTPUT — a piece of data this artifact hands back after running
// ---------------------------------------------------------------
// Example: "balance" — the number the robot read off the screen.
const OutputSchema = z.object({
  name: z.string(),
  type: z.enum(["string", "number", "boolean"]),
  description: z.string().optional(),
  sourceStepId: z.string(), // which step's "extractAs" this came from
});

// ---------------------------------------------------------------
// SUCCESS CONDITION — how do we know the WHOLE recipe finished correctly?
// ---------------------------------------------------------------
const SuccessConditionSchema = z.object({
  type: z.enum(["elementVisible", "urlContains", "textVisible"]),
  expected: z.string(),
});

// ---------------------------------------------------------------
// THE FULL ARTIFACT
// ---------------------------------------------------------------
export const ArtifactSchema = z.object({
  // ---- identity & version info ----
  id: z.string(),               // unique id for this artifact, e.g. "lookup-member-balance"
  name: z.string(),              // human-friendly name
  version: z.string(),           // e.g. "1.0.0" — bump this if the recipe changes later
  createdAt: z.string(),         // when this artifact was first recorded
  createdFrom: z.enum(["discovery", "manual"]), // was this learned by the AI, or hand-written?

  // ---- what app/site this recipe applies to ----
  target: z.object({
    appName: z.string(),         // e.g. "fake-bank-target-app"
    baseUrl: z.string(),         // e.g. "http://localhost:4000"
    entryPoint: z.string(),      // the starting page for this recipe, e.g. "/login"
  }),

  // ---- what this recipe needs and returns ----
  parameters: z.array(ParameterSchema).default([]),
  outputs: z.array(OutputSchema).default([]),

  // ---- the actual recipe ----
  steps: z.array(StepSchema).min(1),

  // ---- how do we know the whole thing worked? ----
  successCondition: SuccessConditionSchema,

  // ---- safety classification (used by the guardrails system later) ----
  riskLevel: z.enum(["safe", "risky"]),
});

// This line creates a TypeScript "type" automatically from the schema
// above, so the rest of our code gets auto-complete and type-checking
// for free, without writing the shape twice.
export type Artifact = z.infer<typeof ArtifactSchema>;
