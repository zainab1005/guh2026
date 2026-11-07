// Backup brain: plain rules, no internet, no API. Used if the AI can't be reached.
// It reads the same facts (ctx) as the AI, including the priorities from the Insights page.

const ITEMS = [
  // [keywords, label, priority id (matches the Insights page), typical £ price if none given]
  [["coffee", "latte", "cappuccino", "flat white", "matcha"], "coffee", "food", 3.5],
  [["lunch", "dinner", "takeaway", "restaurant", "meal", "pizza", "brunch", "snack"], "food", "food", 10],
  [["gym", "yoga", "pilates", "run", "swim", "massage", "therapy", "wellness", "class"], "wellness", "wellness", 8],
  [["course", "textbook", "tuition", "exam", "workshop", "certificate", "book"], "learning", "education", 40],
  [["bus", "tube", "uber", "taxi", "bike", "oyster", "railcard", "petrol", "train", "ticket home"], "travel costs", "transport", 15],
  [["trip", "flight", "hostel", "hotel", "holiday", "weekend away", "travel"], "travel", "travel", 120],
  [["cinema", "movie", "concert", "gig", "netflix", "spotify", "game", "festival"], "entertainment", "entertainment", 12],
  [["rent", "furniture", "deposit", "lamp", "bedding", "curtain"], "housing", "housing", 30],
  [["invest", "stocks", "isa", "crypto", "shares"], "investing", "investments", 50],
  [["emergency fund", "rainy day"], "your emergency fund", "emergency", 20],
  [["overdraft", "loan", "credit card"], "paying off debt", "debt", 25],
  [["donate", "donation", "charity", "gift", "present"], "giving", "giving", 15],
  [["kids", "child", "birthday", "parents", "family"], "family", "family", 25],
  [["trainers", "shoes", "jacket", "clothes", "hoodie", "jeans", "dress"], "clothes", "none", 60],
  [["headphones", "airpods", "laptop", "phone", "gadget", "console"], "tech", "none", 150],
];

const gbp = (n) => `£${Number(n).toFixed(2)}`;
const pretty = (id) => String(id).replace(/-/g, " ");

export function offlineDecision(userMessage, ctx) {
  const text = String(userMessage).toLowerCase();
  const m = text.match(/£\s*(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\s*(?:quid|pounds|gbp)/);
  const stated = m ? parseFloat(m[1] ?? m[2]) : null;

  const has = (k) => new RegExp("\\b" + k + "(?:s|es)?\\b").test(text);
  let item = ITEMS.find(([kws]) => kws.some(has));

  // A priority the user added themselves on the Insights page (e.g. "wedding")
  if (!item) {
    const custom = Object.keys(ctx.priorities ?? {}).find((k) => !ITEMS.some((i) => i[2] === k) && has(k));
    if (custom) item = [[custom], custom, custom, 30];
  }

  const looksLikePurchase = stated != null || /\b(buy|get|grab|afford|spend|book|order)\b/.test(text);

  if (!looksLikePurchase && !item) {
    return {
      verdict: "info",
      reply: `Right now you have ${gbp(ctx.safeToSpend)} that's safe to spend after your bills. Ask me about something you're thinking of buying and I'll check it against what matters to you.`,
      price: 0,
      matchedPriority: "none",
      alternative: "",
    };
  }

  const label = item?.[1] ?? "that";
  const priority = item?.[2] ?? "none";
  const price = stated ?? item?.[3] ?? 10;
  const weight = ctx.priorities?.[priority] ?? 0;
  const level = ctx.priorityLevels?.[priority]; // High / Medium / Low when set on the Insights page
  const matters = level ? level !== "Low" : weight >= 0.25;
  const estimate = stated == null ? " (that's my estimate of the usual price)" : "";
  const safe = ctx.safeToSpend;
  const share = safe > 0 ? price / safe : 1;
  const top = Object.entries(ctx.priorities ?? {}).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topName = top ? pretty(top) : null;

  if (price > safe) {
    return {
      verdict: "wait",
      reply: `${gbp(price)}${estimate} is more than your safe-to-spend of ${gbp(safe)} once rent and bills are covered, so I'd wait until more money lands.`,
      price,
      matchedPriority: priority,
      alternative: topName ? `Save towards it, and put a little more into ${topName}, which matters to you.` : "",
    };
  }
  if (matters || (price <= 5 && share < 0.05)) {
    const why = matters
      ? `it fits what matters to you (${pretty(priority)}${level ? `, which you rated ${level}` : ""})`
      : "it's small and well within your budget";
    return {
      verdict: "buy",
      reply: `Go for it. ${gbp(price)}${estimate} is fine because ${why}, and you'll still have ${gbp(safe - price)} safe to spend.`,
      price,
      matchedPriority: priority,
      alternative: "",
    };
  }
  if (share > 0.25) {
    return {
      verdict: "wait",
      reply: `${gbp(price)}${estimate} would use ${Math.round(share * 100)}% of your safe-to-spend, and ${label} isn't one of your top priorities. I'd wait until after your next pay.`,
      price,
      matchedPriority: priority,
      alternative: topName ? `Spend it on ${topName} instead, which you care about more.` : "",
    };
  }
  return {
    verdict: "swap",
    reply: `${gbp(price)}${estimate} is affordable, but ${label} doesn't line up with your priorities. A swap towards ${topName ?? "something you care about"} might feel better.`,
    price,
    matchedPriority: priority,
    alternative: topName ? `Put it towards ${topName} instead.` : "",
  };
}
