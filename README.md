# Computer Use Agent

A small computer-use automation system for a legacy-style banking web application.

The system demonstrates two modes:

1. **Discovery mode** — a local LLM observes the browser UI, chooses the next allowed action, and executes it.
2. **Replay mode** — a previously created structured artifact is executed deterministically without asking the LLM to make new decisions.

---

## Project Structure

```text
computer-use-agent/
├── artifacts/
│   └── lookup-member-balance.json
├── evidence/
│   ├── discovery-run.json
│   ├── discovery-success.png
│   ├── replay-failures/
│   └── handoff/
├── src/
│   ├── agent/
│   │   ├── actions.ts
│   │   ├── browser.ts
│   │   ├── discovery-log.ts
│   │   ├── discovery.ts
│   │   └── llm.ts
│   ├── artifact/
│   │   ├── schema.ts
│   │   └── validate.ts
│   ├── guardrails/
│   │   ├── policy.ts
│   │   └── test-policy.ts
│   ├── handoff/
│   │   ├── controller.ts
│   │   └── test-handoff.ts
│   └── replay/
│       ├── replay.ts
│       └── test-replay.ts
├── target-app/
├── package.json
├── REPORT.md
└── tsconfig.json
