// Demo persona. Swap this for the real data your teammates produce.
// Keep this SHAPE and Claudia will work with it unchanged.

const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

// Irregular weekly earnings, most recent week first.
const weeklyTotals = [150, 175, 45, 130, 280, 60, 210, 90];

export const mockUser = {
  name: "Maya",
  balance: 640,
  incomeHistory: weeklyTotals.flatMap((t, w) => [
    { date: daysAgo(w * 7 + 1), amount: Math.round(t * 0.6), source: "Cafe shifts" },
    { date: daysAgo(w * 7 + 4), amount: Math.round(t * 0.4), source: "Tutoring" },
  ]),
  bills: [
    { name: "Rent", amount: 400, dueInDays: 6 },
    { name: "Phone", amount: 15, dueInDays: 9 },
    { name: "Spotify + Netflix", amount: 17, dueInDays: 20 },
  ],
  // Weights sum to 1. Collect these in an onboarding sliders screen if time allows.
  priorities: { wellness: 0.4, travel: 0.3, food: 0.2, money: 0.1 },
  spendThisMonth: { coffee: 38, food: 96, transport: 41, wellness: 25, subscriptions: 17 },
  goals: [{ name: "Lisbon trip with friends", target: 120, saved: 45 }],
  recentDecisions: [],
};
