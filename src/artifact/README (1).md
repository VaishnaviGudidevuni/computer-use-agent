# Artifact Schema

This folder defines the "recipe" format used throughout the project.

- `schema.ts` — the strict shape every artifact (recipe) must follow.
- `validate.ts` — a small tool that checks whether a saved artifact
  file actually matches that shape, with clear error messages.

## Try it yourself

```bash
npm install
npx ts-node src/artifact/validate.ts artifacts/lookup-member-balance.json
```

You should see:
```
✅ VALID artifact: "Look up a member and read their current balance" (id: lookup-member-balance)
   Steps: 3
   Parameters needed: memberId
   Outputs returned: balance
```
