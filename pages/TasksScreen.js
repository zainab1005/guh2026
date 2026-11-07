import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
} from "react-native";
import BottomConsole from "./BottomConsole";

/* ------------------------------------------------------------------ */
/* Theme (same palette as the other pages)                             */
/* ------------------------------------------------------------------ */
const COLORS = {
  bg: "#F4EFFA",
  surface: "#FFFFFF",
  surfaceAlt: "#EADFF6",
  border: "#E4D8F2",
  text: "#3B2A55",
  textMuted: "#7D6F96",
  green: "#2F6B4A",
  greenSoft: "#DCEBE2",
  caution: "#B7791F",
  cautionSoft: "#F6E9CF",
  urgent: "#B4543A",
  urgentSoft: "#F5DDD5",
  info: "#7B5BB0",
};

const DEFAULT_HELP_URL = "https://www.moneyhelper.org.uk";

/* ------------------------------------------------------------------ */
/* Sample data (replace by passing an `actions` prop)                  */
/*  type: "adjust" | "transfer" | "help" | "review"                    */
/*  urgency: "urgent" | "soon" | "later"                               */
/*  category matches the ids used on the Personalise page              */
/* ------------------------------------------------------------------ */
const SAMPLE_ACTIONS = [
  {
    id: "a1",
    type: "help",
    urgency: "urgent",
    category: "debt",
    title: "Your overdraft is unusually high",
    detail:
      "You are using £420 of your overdraft, about three times your usual. Fees could apply from Friday.",
    primaryLabel: "Get help",
    helpUrl: DEFAULT_HELP_URL,
  },
  {
    id: "a2",
    type: "adjust",
    urgency: "soon",
    category: "travel",
    title: "Increase your travel budget",
    detail:
      "You have spent £140 on travel this month against a £100 budget, and travel is one of your priorities.",
    change: "£100 → £160 a month",
    primaryLabel: "Update budget",
  },
  {
    id: "a3",
    type: "transfer",
    urgency: "soon",
    category: "emergency",
    title: "Move £150 to your buffer",
    detail:
      "Income arrived 12% above forecast this week. Topping up your buffer keeps you covered through a quiet month.",
    change: "Buffer: 3 weeks → 4 weeks",
    primaryLabel: "Move £150",
  },
  {
    id: "a4",
    type: "adjust",
    urgency: "later",
    category: "food",
    title: "Takeaways are up 40% on usual",
    detail:
      "A gentle limit could free up about £45 this month without changing your regular food shop.",
    change: "Suggested limit: £60 a month",
    primaryLabel: "Set limit",
  },
  {
    id: "a5",
    type: "review",
    urgency: "later",
    category: "subscriptions",
    title: "Review an unused subscription",
    detail:
      "You have not used Streamly in 62 days. It costs £9.99 a month.",
    primaryLabel: "Review",
  },
];

const CATEGORY_META = {
  debt: { icon: "💳", label: "Debt" },
  travel: { icon: "✈️", label: "Travel" },
  emergency: { icon: "🛟", label: "Savings" },
  food: { icon: "🍽️", label: "Food" },
  subscriptions: { icon: "🔁", label: "Subscriptions" },
  income: { icon: "💷", label: "Income" },
  wellness: { icon: "🧘", label: "Wellness" },
  education: { icon: "🎓", label: "Education" },
  investments: { icon: "📊", label: "Investments" },
};

const URGENCY_META = {
  urgent: { label: "Urgent", color: COLORS.urgent, bg: COLORS.urgentSoft, rank: 0 },
  soon: { label: "This week", color: COLORS.caution, bg: COLORS.cautionSoft, rank: 1 },
  later: { label: "When you can", color: COLORS.info, bg: COLORS.surfaceAlt, rank: 2 },
};

/* ------------------------------------------------------------------ */
/* Action card                                                         */
/* ------------------------------------------------------------------ */
function ActionCard({ action, matchesPriority, state, onPrimary, onSecondary }) {
  const cat = CATEGORY_META[action.category] || { icon: "⭐", label: "General" };
  const urg = URGENCY_META[action.urgency] || URGENCY_META.later;
  const finished = state === "done" || state === "dismissed";

  return (
    <View style={[styles.card, finished && styles.cardFinished]}>
      <View style={styles.cardTop}>
        <View style={styles.categoryPill}>
          <Text style={styles.categoryIcon}>{cat.icon}</Text>
          <Text style={styles.categoryText}>{cat.label}</Text>
        </View>
        {!finished && (
          <View style={[styles.urgencyChip, { backgroundColor: urg.bg }]}>
            <Text style={[styles.urgencyText, { color: urg.color }]}>{urg.label}</Text>
          </View>
        )}
        {finished && (
          <Text style={styles.statusText}>
            {state === "done" ? "Done ✓" : "Skipped"}
          </Text>
        )}
      </View>

      <Text style={styles.cardTitle}>{action.title}</Text>
      <Text style={styles.cardDetail}>{action.detail}</Text>

      {action.change ? (
        <View style={styles.changeBox}>
          <Text style={styles.changeText}>{action.change}</Text>
        </View>
      ) : null}

      {matchesPriority && !finished && (
        <View style={styles.matchBadge}>
          <Text style={styles.matchText}>Matches one of your priorities</Text>
        </View>
      )}

      <View style={styles.buttonRow}>
        {!finished ? (
          <>
            <TouchableOpacity style={styles.primaryButton} onPress={onPrimary}>
              <Text style={styles.primaryText}>{action.primaryLabel || "Do it"}</Text>
            </TouchableOpacity>
            {action.type === "help" && (
              <TouchableOpacity style={styles.secondaryButton} onPress={onSecondary.done}>
                <Text style={styles.secondaryText}>Mark done</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.secondaryButton} onPress={onSecondary.skip}>
              <Text style={styles.secondaryText}>Not now</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.secondaryButton} onPress={onSecondary.undo}>
            <Text style={styles.secondaryText}>Undo</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export default function TaskScreen({
  actions, // optional: array shaped like SAMPLE_ACTIONS
  priorities, // optional: array from the Personalise page [{ id, label, level }]
  onActionComplete, // optional: called with the action when the user completes it
  onOpenHelp, // optional: called with the action instead of opening helpUrl
  onNavigateToHome,
  onNavigateToForecast,
  onNavigateToChatbot,
  onNavigateToInsights,
  onNavigateToTasks,
}) {
  const [statuses, setStatuses] = useState({}); // id -> "done" | "dismissed"
  const [tab, setTab] = useState("todo");

  const list = actions && actions.length ? actions : SAMPLE_ACTIONS;
  const priorityIds = useMemo(
    () => (priorities || []).map((p) => p.id),
    [priorities]
  );

  const sorted = useMemo(() => {
    return [...list].sort((a, b) => {
      const ua = (URGENCY_META[a.urgency] || URGENCY_META.later).rank;
      const ub = (URGENCY_META[b.urgency] || URGENCY_META.later).rank;
      if (ua !== ub) return ua - ub;
      const pa = priorityIds.includes(a.category) ? 0 : 1;
      const pb = priorityIds.includes(b.category) ? 0 : 1;
      return pa - pb;
    });
  }, [list, priorityIds]);

  const todo = sorted.filter((a) => !statuses[a.id]);
  const finished = sorted.filter((a) => statuses[a.id]);
  const shown = tab === "todo" ? todo : finished;

  const setStatus = (id, value) =>
    setStatuses((prev) => {
      const next = { ...prev };
      if (value) next[id] = value;
      else delete next[id];
      return next;
    });

  const handlePrimary = (action) => {
    if (action.type === "help") {
      if (onOpenHelp) {
        onOpenHelp(action);
      } else {
        Linking.openURL(action.helpUrl || DEFAULT_HELP_URL).catch(() => {});
      }
      return; // opening help does not complete the action
    }
    setStatus(action.id, "done");
    if (onActionComplete) onActionComplete(action);
  };

  const urgentCount = todo.filter((a) => a.urgency === "urgent").length;
  const summary =
    todo.length === 0
      ? "You are all caught up."
      : urgentCount > 0
      ? `${urgentCount} ${urgentCount === 1 ? "action needs" : "actions need"} your attention first.`
      : "Nothing urgent. Here is what could help most.";

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Top widget */}
        <View style={styles.widget}>
          <Text style={styles.pageTitle}>Actions</Text>
          <Text style={styles.summary}>{summary}</Text>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{todo.length}</Text>
              <Text style={styles.statLabel}>to do</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>
                {finished.filter((a) => statuses[a.id] === "done").length}
              </Text>
              <Text style={styles.statLabel}>done</Text>
            </View>
          </View>

          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, tab === "todo" && styles.tabActive]}
              onPress={() => setTab("todo")}
            >
              <Text style={[styles.tabText, tab === "todo" && styles.tabTextActive]}>
                To do ({todo.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, tab === "done" && styles.tabActive]}
              onPress={() => setTab("done")}
            >
              <Text style={[styles.tabText, tab === "done" && styles.tabTextActive]}>
                Done ({finished.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Cards */}
        {shown.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {tab === "todo"
                ? "Nothing to do right now. New actions appear as your spending and income change."
                : "Nothing here yet. Actions you complete or skip will show up here."}
            </Text>
          </View>
        ) : (
          shown.map((action) => (
            <ActionCard
              key={action.id}
              action={action}
              state={statuses[action.id]}
              matchesPriority={priorityIds.includes(action.category)}
              onPrimary={() => handlePrimary(action)}
              onSecondary={{
                done: () => {
                  setStatus(action.id, "done");
                  if (onActionComplete) onActionComplete(action);
                },
                skip: () => setStatus(action.id, "dismissed"),
                undo: () => setStatus(action.id, null),
              }}
            />
          ))
        )}
      </ScrollView>

      <BottomConsole
        active="tasks"
        onNavigateToHome={onNavigateToHome}
        onNavigateToForecast={onNavigateToForecast}
        onNavigateToChatbot={onNavigateToChatbot}
        onNavigateToInsights={onNavigateToInsights}
        onNavigateToTasks={onNavigateToTasks}
      />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scroll: {
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  widget: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#5C2D79",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  pageTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 6,
  },
  summary: {
    color: COLORS.textMuted,
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: "row",
    marginBottom: 14,
  },
  stat: {
    flexDirection: "row",
    alignItems: "baseline",
    marginRight: 24,
  },
  statNumber: {
    color: COLORS.green,
    fontSize: 28,
    fontWeight: "700",
    marginRight: 6,
  },
  statLabel: {
    color: COLORS.text,
    fontSize: 14,
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 14,
    padding: 3,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 11,
  },
  tabActive: {
    backgroundColor: COLORS.green,
  },
  tabText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#FFFFFF",
  },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#5C2D79",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 1,
  },
  cardFinished: {
    opacity: 0.7,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  categoryIcon: {
    fontSize: 13,
    marginRight: 5,
  },
  categoryText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "600",
  },
  urgencyChip: {
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: "700",
  },
  statusText: {
    color: COLORS.green,
    fontSize: 13,
    fontWeight: "700",
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 6,
  },
  cardDetail: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  changeBox: {
    backgroundColor: COLORS.bg,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 12,
    alignSelf: "flex-start",
  },
  changeText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "600",
  },
  matchBadge: {
    backgroundColor: COLORS.greenSoft,
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginTop: 12,
    alignSelf: "flex-start",
  },
  matchText: {
    color: COLORS.green,
    fontSize: 12,
    fontWeight: "700",
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 14,
  },
  primaryButton: {
    backgroundColor: COLORS.green,
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 18,
    marginRight: 10,
  },
  primaryText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  secondaryButton: {
    paddingVertical: 11,
    paddingHorizontal: 10,
  },
  secondaryText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },

  empty: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
});