# Computer Use Agent — Take-Home Report

## Architecture

The system separates first-time UI discovery from repeatable execution.

The main flow is:

Goal
→ Observe the live UI
→ Ask the local LLM for the next action
→ Validate the action against safety policy
→ Execute the browser action
→ Observe again

After a workflow is understood, it is represented as a versioned structured artifact.

Replay then follows:

Saved artifact + runtime parameters
→ Validate artifact
→ Execute ordered steps deterministically
→ Verify checkpoints
→ Extract typed outputs
→ Return structured result

The implementation uses:

- TypeScript
- Playwright for browser automation
- Zod for artifact validation
- Ollama with Qwen for local LLM-based discovery
- A local mock banking application as the target surface

The browser surface is intentionally kept separate from the decision layer. This allows the decision logic and replay logic to operate against a browser abstraction rather than embedding application-specific logic throughout the system.

## Artifact schema

The reusable workflow is stored in:

`artifacts/lookup-member-balance.json`

The artifact contains:

- `id`
- `name`
- `version`
- `description`
- target application information
- typed input parameters
- typed outputs
- ordered steps
- locator strategies
- fallback locator strategies
- checkpoints
- success condition
- artifact status

Each step contains an explicit action type such as:

- navigate
- click
- type
- extract
- wait

Inputs and outputs have explicit types.

For example, the member ID is a string input and the current balance is returned as a number.

The artifact also contains locator fallbacks. This is important for a legacy-style UI because a single selector may become invalid after small UI changes.

Credentials are treated as runtime values rather than reusable artifact data. The actual password is not stored in the artifact.

The artifact can be validated using the Zod-based validator:

`src/artifact/validate.ts`

## Determinism & error handling

Replay does not ask the LLM to make new decisions.

Instead, the replay engine reads the saved artifact and executes its ordered steps.

For each step, replay:

1. Identifies the target using the stored locator strategy.
2. Attempts the configured fallback if necessary.
3. Performs the specified action.
4. Verifies checkpoints when present.
5. Extracts outputs when required.
6. Checks the final success condition.

The replay engine returns explicit result categories:

- `success`
- `business_outcome`
- `recoverable`
- `hard_failure`

A known business result such as a member not being found is separated from a technical failure.

The balance extraction also converts a displayed value such as:

`$4520.75`

into the typed numeric output:

`4520.75`

This keeps the replay result machine-readable.

## Heterogeneity & multi-tenant

The implementation uses a browser surface abstraction so the core workflow does not need to depend on one specific application implementation.

For additional web applications, a surface adapter can provide:

- navigation
- observation
- interaction
- extraction
- screenshot/evidence capture

For legacy web applications, the artifact can use multiple locator strategies such as CSS, XPath, role, text, and label.

For desktop applications, the same high-level artifact model can be retained while replacing the browser surface with a desktop surface adapter.

Tenant-specific differences can be handled through:

- target metadata
- tenant-specific locator mappings
- artifact versions
- configurable policies
- surface-specific adapters

If a UI changes enough that the existing artifact can no longer safely replay, replay should fail explicitly rather than asking the deterministic executor to invent a new action.

A new discovery run can then produce a reviewed artifact version.

## Escalation & handoff

The system contains a handoff controller with explicit states:

`agent_running`

↓

`paused_for_human`

↓

`human_control`

↓

`resumed`

↓

`completed`

A handoff can be triggered for reasons such as:

- risky action
- agent uncertainty
- repeated failure
- human request

When a handoff occurs, the agent is paused and the browser session remains active for human inspection.

The human operator can take control and subsequently return control to the agent.

The handoff controller is intentionally small so that control ownership is explicit rather than implicit.

A production implementation would connect these states to an operator UI and would preserve the same browser/session context, logs, screenshots, and other evidence throughout the transfer.

## Safety

The system uses a configurable action allowlist.

Current permitted read-oriented actions include:

- `login`
- `search_member`
- `extract_member`

Actions are classified as:

- safe
- sensitive
- risky

Login is classified as sensitive because credentials are involved.

Examples of risky actions include:

- `transfer_money`
- `create_sub_account`
- `delete_account`

These actions are blocked when they are not included in the configured allowlist.

The guardrail is checked before an action is executed.

This provides a second layer of protection between the LLM's proposed action and the browser.

The system also avoids printing credential values to logs. Credentials are supplied at runtime and are not stored in the reusable artifact.

A production system should additionally integrate secret management, audit logging, authorization boundaries, and stronger confirmation requirements for irreversible financial actions.

### Evidence

The `evidence/` directory contains evidence captured from the successful banking workflow.

Current evidence includes:

- `successful-member-balance.png`
- `successful-member-balance.html`
- `successful-member-balance.txt`

The evidence shows the workflow reaching the member detail page and displaying:

- Member ID: `10001`
- Name: `Priya Shah`
- Current Balance: `$4520.75`

The screenshot provides visual evidence, while the HTML and text files provide machine-readable and human-readable evidence.

The project also contains structured logging support for discovery decisions.

## Cuts

The implementation intentionally focuses on one concrete workflow:

`Look up member balance`

The following areas are simplified compared with a production system:

- Only a local mock banking application is implemented.
- Desktop automation is represented by the surface abstraction rather than a complete desktop implementation.
- Multi-tenant support is primarily represented through the architecture rather than multiple deployed tenants.
- Human handoff uses a state controller rather than a complete production operator console.
- Credential management uses runtime-only values in this prototype rather than a production secret-management service.
- The discovery agent currently supports a small, explicitly constrained action vocabulary.
- Artifact generation and human approval are simplified compared with a production artifact review pipeline.

These cuts keep the implementation focused on demonstrating the central design:

LLM-driven first-time discovery

→ structured reusable artifact

→ deterministic replay

with explicit safety, verification, evidence, and human escalation.