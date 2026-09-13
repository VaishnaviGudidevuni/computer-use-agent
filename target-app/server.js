/**
 * FAKE LEGACY BANKING APP
 * ------------------------
 * This is a pretend, old-fashioned bank back-office app.
 * It exists ONLY so an AI "computer use" agent has something
 * realistic (but harmless) to practice clicking around in.
 *
 * There is no real data, no real money, no real customers.
 * Everything lives in memory and resets when the server restarts.
 *
 * "Trick switches": you can add ?simulate=XYZ to certain URLs
 * to force the app to behave badly on purpose (e.g. show an
 * error, or an expired session). This is how we will later test
 * that the automation handles real-world problems gracefully.
 */

const express = require("express");
const app = express();

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.use(express.urlencoded({ extended: true })); // lets us read <form> submissions
app.use(express.static(__dirname + "/public"));

const PORT = process.env.PORT || 4000;

// ---- Fake "database" of members (just a list sitting in memory) ----
const members = [
  { id: "10001", name: "Priya Shah", balance: 4520.75, subAccounts: [] },
  { id: "10002", name: "James Carter", balance: 129.00, subAccounts: [] },
  { id: "10003", name: "Aiko Tanaka", balance: 98765.43, subAccounts: [] },
];

// Very fake "session" tracking — just one global flag, on purpose (keeps
// this small). A real app would use signed cookies; we don't need that
// complexity for a practice target.
let loggedIn = false;

// ---------------------------------------------------------------
// LOGIN
// ---------------------------------------------------------------
app.get("/login", (req, res) => {
  res.render("login", { error: null });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  // Any non-empty username/password "logs in" — this is a fake app.
  if (!username || !password) {
    return res.render("login", { error: "Username and password are required." });
  }
  loggedIn = true;
  res.redirect("/members/search");
});

// A helper "gate" — most pages require being logged in first.
// If ?simulate=session_timeout is present, we pretend the session died.
function requireLogin(req, res, next) {
  if (req.query.simulate === "session_timeout") {
    loggedIn = false;
  }
  if (!loggedIn) {
    return res.status(401).render("login", {
      error: "Your session has expired. Please log in again.",
    });
  }
  next();
}

// ---------------------------------------------------------------
// MEMBER SEARCH
// ---------------------------------------------------------------
app.get("/members/search", requireLogin, (req, res) => {
  res.render("search", { result: null, error: null, query: "" });
});

app.get("/members/search/results", requireLogin, (req, res) => {
  const q = (req.query.memberId || "").trim();
  const simulate = req.query.simulate;

  if (simulate === "validation_error" || q === "") {
    return res.render("search", {
      result: null,
      error: "Please enter a valid numeric Member ID.",
      query: q,
    });
  }

  if (simulate === "not_found") {
    return res.render("search", {
      result: null,
      error: `No member found with ID ${q}.`,
      query: q,
    });
  }

  const member = members.find((m) => m.id === q);
  if (!member) {
    return res.render("search", {
      result: null,
      error: `No member found with ID ${q}.`,
      query: q,
    });
  }

  res.redirect(`/members/${member.id}`);
});

// ---------------------------------------------------------------
// MEMBER DETAIL (shows balance)
// ---------------------------------------------------------------
app.get("/members/:id", requireLogin, (req, res) => {
  const member = members.find((m) => m.id === req.params.id);
  if (!member) {
    return res.status(404).render("search", {
      result: null,
      error: `No member found with ID ${req.params.id}.`,
      query: req.params.id,
    });
  }
  res.render("member-detail", { member });
});

// ---------------------------------------------------------------
// OPEN SUB-ACCOUNT (multi-step form -> confirmation)
// ---------------------------------------------------------------
app.get("/members/:id/sub-account/new", requireLogin, (req, res) => {
  const member = members.find((m) => m.id === req.params.id);
  if (!member) {
    return res.status(404).render("search", {
      result: null,
      error: `No member found with ID ${req.params.id}.`,
      query: req.params.id,
    });
  }
  res.render("new-sub-account", { member, error: null });
});

app.post("/members/:id/sub-account/new", requireLogin, (req, res) => {
  const member = members.find((m) => m.id === req.params.id);
  if (!member) {
    return res.status(404).render("search", {
      result: null,
      error: `No member found with ID ${req.params.id}.`,
      query: req.params.id,
    });
  }

  const { accountType, openingDeposit } = req.body;
  const simulate = req.query.simulate;

  if (simulate === "validation_error" || !accountType || Number(openingDeposit) <= 0) {
    return res.render("new-sub-account", {
      member,
      error: "Opening deposit must be a positive number and an account type must be selected.",
    });
  }

  const newAccount = {
    accountType,
    openingDeposit: Number(openingDeposit),
    accountNumber: `SUB-${Math.floor(1000 + Math.random() * 9000)}`,
  };
  member.subAccounts.push(newAccount);

  res.render("confirmation", { member, account: newAccount });
});

// ---------------------------------------------------------------
// CONFIRMATION PANEL (rendered *inside* an iframe on purpose,
// mimicking how some real legacy banking apps embed sub-panels)
// ---------------------------------------------------------------
app.get("/confirmation-panel", (req, res) => {
  const { accountNumber, accountType, openingDeposit, memberId } = req.query;
  res.send(`
    <html><body style="font-family: monospace;">
      <p>CONFIRMED</p>
      <p>Member: ${memberId}</p>
      <p>New Account #: ${accountNumber}</p>
      <p>Type: ${accountType}</p>
      <p>Opening Deposit: $${openingDeposit}</p>
    </body></html>
  `);
});

// ---------------------------------------------------------------
// HOME
// ---------------------------------------------------------------
app.get("/", (req, res) => {
  res.redirect(loggedIn ? "/members/search" : "/login");
});

app.listen(PORT, () => {
  console.log(`Fake bank app running at http://localhost:${PORT}`);
});
