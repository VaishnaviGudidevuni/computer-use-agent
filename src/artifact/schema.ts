import { z } from "zod";

/**
 * Describes how the agent should find an element on the screen.
 *
 * We use multiple strategies because legacy applications
 * may not have reliable test IDs or modern HTML.
 */
export const LocatorStrategySchema = z.object({
  type: z.enum([
    "role",
    "text",
    "label",
    "css",
    "xpath",
    "iframe",
  ]),
  value: z.string(),
  fallback: z
    .array(
      z.object({
        type: z.enum([
          "role",
          "text",
          "label",
          "css",
          "xpath",
          "iframe",
        ]),
        value: z.string(),
      }),
    )
    .optional(),
});

/**
 * A single action the replay engine can perform.
 */
export const ArtifactStepSchema = z.object({
  id: z.string(),

  action: z.enum([
    "navigate",
    "click",
    "type",
    "select",
    "extract",
    "wait",
  ]),

  description: z.string(),

  target: LocatorStrategySchema.optional(),

  value: z.string().optional(),

  output: z.string().optional(),

  checkpoint: z.string().optional(),
});

/**
 * Input parameter supplied when an artifact is replayed.
 */
export const ArtifactInputSchema = z.object({
  name: z.string(),
  type: z.enum(["string", "number", "boolean"]),
  description: z.string(),
  required: z.boolean(),
});

/**
 * Output returned to the calling AI agent.
 */
export const ArtifactOutputSchema = z.object({
  name: z.string(),
  type: z.enum(["string", "number", "boolean", "object"]),
  description: z.string(),
});

/**
 * Complete reusable automation capability.
 */
export const ArtifactSchema = z.object({
  id: z.string(),

  name: z.string(),

  version: z.string(),

  description: z.string(),

  target: z.object({
    appName: z.string(),
    baseUrl: z.string(),
  }),

  parameters: z.array(ArtifactInputSchema),

  outputs: z.array(ArtifactOutputSchema),

  steps: z.array(ArtifactStepSchema),

  successCondition: z.string(),

  createdAt: z.string(),

  status: z.enum(["draft", "approved"]),
});

export type LocatorStrategy = z.infer<typeof LocatorStrategySchema>;

export type ArtifactStep = z.infer<typeof ArtifactStepSchema>;

export type ArtifactInput = z.infer<typeof ArtifactInputSchema>;

export type ArtifactOutput = z.infer<typeof ArtifactOutputSchema>;

export type Artifact = z.infer<typeof ArtifactSchema>;