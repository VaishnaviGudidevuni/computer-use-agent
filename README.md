
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