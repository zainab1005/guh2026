// Backup brain: plain rules, no internet, no API. Used if the AI can't be reached.
// It reads the same facts (ctx) as the AI, so the app still behaves sensibly.

const ITEMS = [
  // [keywords, label, priority it relates to, typical £ price if none given]
  [["coffee", "latte", "cappuccino", "flat white", "matcha"], "coffee", "food", 3.5],
  [["lunch", "dinner", "takeaway", "restaurant", "meal", "pizza", "brunch", "snack"], "food", "food", 10],
  [["gym", "yoga", "pilates", "class", "run", "swim", "massage", "therapy", "wellness"], "wellness", "wellness", 8],
  [["trip", "flight", "train", "hostel", "hotel", "holiday", "weekend away", "travel"], "travel", "travel", 120],
  [["trainers", "shoes", "jacket", "clothes", "hoodie", "jeans", "dress"], "clothes", "none", 60],
  [["headphones", "airpods", "laptop", "phone", "gadget", "console", "game"], "tech", "none", 150],
];

const gbp = (n) => `£${Number(n).toFixed(2)}`;

export function offlineDecision(userMessage, ctx) {
  const text = String(userMessage).toLowerCase();
  const m = text.match(/£\s*(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\s*(?:quid|pounds|gbp)/);
  const stated = m ? parseFloat(m[1] ?? m[2]) : null;

  const item = ITEMS.find(([kws]) => kws.some((k) => text.includes(k)));
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
  const estimate = stated == null ? " (that's my estimate of the usual price)" : "";
  const safe = ctx.safeToSpend;
  const share = safe > 0 ? price / safe : 1;
  const top = Object.entries(ctx.priorities ?? {}).sort((a, b) => b[1] - a[1])[0]?.[0];

  if (price > safe) {
    return {
      verdict: "wait",
      reply: `${gbp(price)}${estimate} is more than your safe-to-spend of ${gbp(safe)} once rent and bills are covered, so I'd wait until more money lands.`,
      price,
      matchedPriority: priority,
      alternative: top ? `Save towards it, and put a little more into ${top}, which matters to you.` : "",
    };
  }
  if (weight >= 0.25 || (price <= 5 && share < 0.05)) {
    const why = weight >= 0.25 ? `it fits what matters to you (${priority})` : "it's small and well within your budget";
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
      alternative: top ? `Spend it on ${top} instead, which you care about more.` : "",
    };
  }
  return {
    verdict: "swap",
    reply: `${gbp(price)}${estimate} is affordable, but ${label} doesn't line up with your priorities. A swap towards ${top ?? "something you care about"} might feel better.`,
    price,
    matchedPriority: priority,
    alternative: top ? `Put it towards ${top} instead.` : "",
  };
}
