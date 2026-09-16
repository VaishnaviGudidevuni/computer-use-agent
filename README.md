# Computer Use Agent

A small computer-use automation system for a legacy-style banking web application.

The system demonstrates two modes:

1. **Discovery mode** — a local LLM observes the browser UI, chooses the next allowed action, and executes it.
2. **Replay mode** — a previously created structured artifact is executed deterministically without asking the LLM to make new decisions.

## Project Structure

```text
computer-use-agent/
├── artifacts/
│   └── lookup-member-balance.json
├── evidence/
│   ├── successful-member-balance.png
│   ├── successful-member-balance.html
│   └── successful-member-balance.txt
├── src/
│   ├── agent/
│   │   ├── actions.ts
│   │   ├── browser.ts
│   │   ├── discovery.ts
│   │   ├── discovery-log.ts
│   │   ├── llm.ts
│   │   └── test-*.ts
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
└── tsconfig.json