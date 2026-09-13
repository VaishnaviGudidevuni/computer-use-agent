# Fake Legacy Banking App (Target App)

This is a **pretend** bank back-office website. It exists only so an AI
"computer-use" agent has something realistic to practice clicking around
in. There is no real data, no real customers, no real money.

It is deliberately old-fashioned looking (plain tables, no modern styling,
one iframe) because real legacy bank software tends to look like this.

## What it can do

- `/login` — fake login (any non-empty username/password works)
- `/members/search` — search for a member by ID
- `/members/:id` — view a member's balance
- `/members/:id/sub-account/new` — open a new sub-account (2-step form → confirmation)

Try these member IDs: `10001`, `10002`, `10003`

## "Trick switches" for testing error handling

Add `?simulate=XYZ` (or `&simulate=XYZ` if the URL already has a `?`) to
force the app to misbehave on purpose, so we can later test that the
automation handles these gracefully instead of crashing:

| Value | What it does |
|---|---|
| `not_found` | Pretends the searched member doesn't exist |
| `validation_error` | Pretends the form was filled in incorrectly |
| `session_timeout` | Pretends your login session expired |

Example: `http://localhost:4000/members/search/results?memberId=10001&simulate=not_found`

## How to run it

```bash
npm install
node server.js
```

Then open **http://localhost:4000** in your browser.

## Why it's built this way

- **No database** — everything is a plain list of members sitting in the
  server's memory, so there is nothing extra to install or configure.
- **No test IDs / helpful automation labels** — on purpose. Real legacy
  bank software almost never has these, so the automation that drives
  this app has to rely on more human-like cues (visible text, page
  structure) instead.
- **One iframe on the confirmation page** — on purpose. Some real legacy
  systems embed a "panel" as a mini separate page. Automation has to know
  to look inside it.
