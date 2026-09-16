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
│   ├── discovery-run.json
│   ├── discovery-success.png
│   ├── handoff/
│   ├── replay-failures/
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
```

## Setup

**Requirements**
- Node.js 18+
- [Ollama](https://ollama.ai) installed and running locally, with the model pulled:
  ```
  ollama pull qwen2.5:7b
  ```
- No API key required — discovery runs entirely against a local Ollama model.

**Install dependencies**
```
npm install
```

**Start the target mock banking app**
```
cd target-app && npm install && node server.js
```

## Demo path

1. **Run discovery** — drives the live mock banking app via an LLM-driven observe/decide/act loop (log in, search member 10001, extract balance):
   ```
   npx ts-node src/agent/discovery.ts
   ```
   Produces/updates `evidence/discovery-run.json` and a screenshot.

2. **Validate the resulting artifact against its schema:**
   ```
   npx ts-node src/artifact/validate.ts artifacts/lookup-member-balance.json
   ```

3. **Replay the artifact deterministically** (no LLM involved):
   ```
   npx ts-node src/replay/test-replay.ts
   ```

4. **Run safety/guardrail and handoff checks:**
   ```
   npx ts-node src/guardrails/test-policy.ts
   npx ts-node src/handoff/test-handoff.ts
   ```

See `REPORT.md` for the full design write-up, and `evidence/` for discovery, replay-failure, and handoff evidence.
