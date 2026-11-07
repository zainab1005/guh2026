// Turns raw user data into the FACTS Claudia is allowed to talk about.
// All maths lives here, in plain code. Claude never calculates balances.

const round = (n) => Math.round(n * 100) / 100;
const DAY = 86400000;
const BUFFER = 20; // £ we never let the user spend (emergency cushion)

function weeklyIncomes(history, weeks = 8) {
  const totals = Array(weeks).fill(0);
  const now = Date.now();
  for (const p of history) {
    const w = Math.floor((now - Date.parse(p.date)) / DAY / 7);
    if (w >= 0 && w < weeks) totals[w] += Number(p.amount) || 0;
  }
  return totals;
}

export function buildContext(user) {
  const weekly = weeklyIncomes(user.incomeHistory ?? []);
  const sorted = [...weekly].sort((a, b) => a - b);
  const avg = weekly.reduce((a, b) => a + b, 0) / weekly.length;
  const low = sorted.slice(0, 3).reduce((a, b) => a + b, 0) / 3; // bad-week estimate

  const bills = [...(user.bills ?? [])].sort((a, b) => a.dueInDays - b.dueInDays);
  const billsDue14 = bills.filter((b) => b.dueInDays <= 14).reduce((s, b) => s + b.amount, 0);

  const balance = Number(user.balance) || 0;
  // Conservative: ignore future income entirely when deciding what is safe to spend.
  const safeToSpend = round(Math.max(0, balance - billsDue14 - BUFFER));
  const shortfallRisk = balance - billsDue14 + low * 2 < 0;

  return {
    currency: "GBP",
    balance: round(balance),
    safeToSpend,
    billsDueNext14Days: round(billsDue14),
    upcomingBills: bills.map((b) => ({ name: b.name, amount: b.amount, dueInDays: b.dueInDays })),
    incomeForecastPerWeek: {
      typical: round(avg),
      badWeek: round(low),
      bestWeek: round(Math.max(...weekly)),
      note: "Irregular income: weekly earnings vary a lot.",
    },
    shortfallRisk,
    priorities: user.priorities ?? {},
    priorityLevels: user.priorityLevels ?? undefined, // High / Medium / Low, from the Insights page
    monthSpendByCategory: user.spendThisMonth ?? {},
    goals: user.goals ?? [],
    recentDecisions: (user.recentDecisions ?? []).slice(-5),
  };
}

// Hard rules Claude cannot talk its way around.
export function applyGuardrail(decision, ctx) {
  const price = Number(decision.price) > 0 ? Number(decision.price) : 0;
  let { verdict, reply } = decision;
  let guardrailTriggered = false;

  if (verdict === "buy" && price > ctx.safeToSpend) {
    guardrailTriggered = true;
    verdict = "wait";
    reply =
      `That's £${price.toFixed(2)}, but your safe-to-spend is £${ctx.safeToSpend.toFixed(2)} ` +
      `after upcoming bills, so I'd hold off until more money lands.` +
      (decision.alternative ? ` ${decision.alternative}` : "");
  }

  return {
    verdict,
    reply,
    price,
    matchedPriority: decision.matchedPriority ?? "none",
    alternative: decision.alternative ?? "",
    safeToSpend: ctx.safeToSpend,
    safeToSpendAfter: verdict === "buy" ? round(ctx.safeToSpend - price) : ctx.safeToSpend,
    guardrailTriggered,
  };
}
