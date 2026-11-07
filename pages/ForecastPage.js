import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from "react-native";
import BottomConsole from "./BottomConsole";

const COLORS = {
  bg: "#F4EFFA",
  surface: "#FFFFFF",
  surfaceAlt: "#EADFF6",
  border: "#E4D8F2",
  text: "#3B2A55",
  textMuted: "#7D6F96",
  green: "#2F6B4A",
  greenSoft: "#DCEBE2",
  band: "rgba(47,107,74,0.20)",
  bandEdge: "rgba(47,107,74,0.45)",
  line: "#3B2A55",
  actual: "#2F6B4A",
  caution: "#B7791F",
  positive: "#2F6B4A",
  info: "#7B5BB0",
  buffer: "#B7791F",
};

const CHART_HEIGHT = 170;

function buildSampleForecast(days) {
  const points = [];
  const pastDays = 7;
  let balance = 1800;
  for (let i = -pastDays; i < days; i++) {
    const wave = Math.sin(i / 3) * 90;
    const drift = i < 0 ? 12 : -26;
    balance += drift + wave * 0.2;
    if (i === 6) balance += 650;
    if (i === 12) balance -= 850;
    const spread = i < 0 ? 0 : 60 + i * 14;
    points.push({
      label: i === 0 ? "Today" : i < 0 ? `${-i}d ago` : `+${i}d`,
      actual: i < 0,
      low: Math.round(balance - spread * 1.3),
      likely: Math.round(balance),
      high: Math.round(balance + spread),
    });
  }
  return points;
}

const SAMPLE_INSIGHTS = [
  {
    id: "1",
    type: "warning",
    title: "Increased spending on takeaways",
    detail: "You are £64 above your usual for this point in the month.",
  },
  {
    id: "2",
    type: "warning",
    title: "Lower average income this month",
    detail: "Income is 18% below your 3-month average so far.",
  },
  {
    id: "3",
    type: "info",
    title: "A late payment is affecting your outlook",
    detail: "The Henderson invoice is 9 days late. We now assume it lands by the 20th.",
  },
  {
    id: "4",
    type: "positive",
    title: "Subscriptions are down",
    detail: "You are spending £14 less on subscriptions than last month.",
  },
];

const RANGES = [
  { key: "14", label: "2 weeks", days: 14 },
  { key: "30", label: "30 days", days: 30 },
];

const INSIGHT_ACCENT = {
  warning: COLORS.caution,
  positive: COLORS.positive,
  info: COLORS.info,
};

const INSIGHT_MARK = { warning: "!", positive: "+", info: "i" };

const money = (n) =>
  `${n < 0 ? "-" : ""}£${Math.abs(Math.round(n)).toLocaleString("en-GB")}`;

function ForecastChart({ points, buffer, selectedIndex, onSelect }) {
  const { min, max } = useMemo(() => {
    const values = points.flatMap((p) => [p.low, p.high, p.likely]);
    values.push(buffer);
    const lo = Math.min(...values);
    const hi = Math.max(...values);
    const pad = (hi - lo) * 0.08 || 1;
    return { min: lo - pad, max: hi + pad };
  }, [points, buffer]);

  const toY = (v) => ((v - min) / (max - min)) * CHART_HEIGHT;

  return (
    <View style={styles.chartWrap}>
      <View style={styles.chartArea}>
        <View style={[styles.bufferLine, { bottom: toY(buffer) }]} />
        <Text style={[styles.bufferLabel, { bottom: toY(buffer) + 3 }]}>
          Buffer {money(buffer)}
        </Text>

        <View style={styles.columns}>
          {points.map((p, i) => {
            const selected = i === selectedIndex;
            return (
              <Pressable
                key={i}
                style={styles.column}
                onPress={() => onSelect(i)}
              >
                {selected && <View style={styles.cursor} />}
                {!p.actual && (
                  <View
                    style={[
                      styles.bandBar,
                      {
                        bottom: toY(p.low),
                        height: Math.max(2, toY(p.high) - toY(p.low)),
                      },
                    ]}
                  />
                )}
                <View
                  style={[
                    p.actual ? styles.actualDot : styles.likelyDot,
                    { bottom: toY(p.likely) - 2 },
                    selected && styles.selectedDot,
                  ]}
                />
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.axisRow}>
        <Text style={styles.axisText}>{points[0].label}</Text>
        <Text style={styles.axisText}>Today</Text>
        <Text style={styles.axisText}>{points[points.length - 1].label}</Text>
      </View>
    </View>
  );
}

function InsightCard({ insight }) {
  const accent = INSIGHT_ACCENT[insight.type] || COLORS.info;
  return (
    <View style={styles.insightCard}>
      <View style={[styles.insightMark, { borderColor: accent }]}>
        <Text style={[styles.insightMarkText, { color: accent }]}>
          {INSIGHT_MARK[insight.type] || "i"}
        </Text>
      </View>
      <View style={styles.insightBody}>
        <Text style={styles.insightTitle}>{insight.title}</Text>
        <Text style={styles.insightDetail}>{insight.detail}</Text>
      </View>
    </View>
  );
}

export default function ForecastPage({
  forecast,
  insights,
  buffer = 500,
  onNavigateToHome,
  onNavigateToForecast,
  onNavigateToChatbot,
  onNavigateToInsights,
  onNavigateToTasks,
}) {
  const [rangeKey, setRangeKey] = useState("30");
  const range = RANGES.find((r) => r.key === rangeKey);

  const points = useMemo(
    () => (forecast && forecast.length ? forecast : buildSampleForecast(range.days)),
    [forecast, range.days]
  );

  const todayIndex = Math.max(0, points.findIndex((p) => !p.actual));
  const [selectedIndex, setSelectedIndex] = useState(null);
  const shownIndex = selectedIndex !== null && selectedIndex < points.length
    ? selectedIndex
    : todayIndex;
  const shown = points[shownIndex];

  const insightList = insights && insights.length ? insights : SAMPLE_INSIGHTS;

  const headline = useMemo(() => {
    const risk = points.find((p) => !p.actual && p.low < buffer);
    if (!risk) return "You look comfortable for this whole period.";
    return `If work slows, things could get tight around ${risk.label}.`;
  }, [points, buffer]);

  const changeRange = (key) => {
    setRangeKey(key);
    setSelectedIndex(null);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.widget}>
          <View style={styles.widgetHeader}>
            <Text style={styles.pageTitle}>Forecast</Text>
            <View style={styles.rangeSwitch}>
              {RANGES.map((r) => (
                <TouchableOpacity
                  key={r.key}
                  onPress={() => changeRange(r.key)}
                  style={[
                    styles.rangeChip,
                    r.key === rangeKey && styles.rangeChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.rangeText,
                      r.key === rangeKey && styles.rangeTextActive,
                    ]}
                  >
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Text style={styles.headline}>{headline}</Text>

          <View style={styles.readout}>
            <Text style={styles.readoutDate}>{shown.label}</Text>
            <Text style={styles.readoutValue}>{money(shown.likely)}</Text>
            {!shown.actual && (
              <Text style={styles.readoutRange}>
                Range {money(shown.low)} to {money(shown.high)}
              </Text>
            )}
          </View>

          <ForecastChart
            points={points}
            buffer={buffer}
            selectedIndex={shownIndex}
            onSelect={setSelectedIndex}
          />

          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendSwatch, { backgroundColor: COLORS.actual }]} />
              <Text style={styles.legendText}>Past balance</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendSwatch, { backgroundColor: COLORS.line }]} />
              <Text style={styles.legendText}>Most likely</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendSwatch, { backgroundColor: COLORS.bandEdge }]} />
              <Text style={styles.legendText}>If work picks up or slows</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>What is shaping your forecast</Text>
        {insightList.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </ScrollView>

      <BottomConsole
        active="forecast"
        onNavigateToHome={onNavigateToHome}
        onNavigateToForecast={onNavigateToForecast}
        onNavigateToChatbot={onNavigateToChatbot}
        onNavigateToInsights={onNavigateToInsights}
        onNavigateToTasks={onNavigateToTasks}
      />
    </View>
  );
}

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
    marginBottom: 24,
    shadowColor: "#5C2D79",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  widgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  pageTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "700",
  },
  rangeSwitch: {
    flexDirection: "row",
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 14,
    padding: 3,
  },
  rangeChip: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 11,
  },
  rangeChipActive: {
    backgroundColor: COLORS.green,
  },
  rangeText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  rangeTextActive: {
    color: "#FFFFFF",
  },
  headline: {
    color: COLORS.text,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 14,
  },
  readout: {
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  readoutDate: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginRight: 8,
  },
  readoutValue: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: "700",
    marginRight: 10,
  },
  readoutRange: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  chartWrap: {
    marginTop: 4,
  },
  chartArea: {
    height: CHART_HEIGHT,
    position: "relative",
  },
  columns: {
    flexDirection: "row",
    height: CHART_HEIGHT,
  },
  column: {
    flex: 1,
    height: CHART_HEIGHT,
    alignItems: "center",
  },
  bandBar: {
    position: "absolute",
    width: "70%",
    backgroundColor: COLORS.band,
    borderRadius: 2,
  },
  likelyDot: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.line,
  },
  actualDot: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.actual,
  },
  selectedDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginLeft: 0,
    transform: [{ translateY: 2.5 }],
    backgroundColor: COLORS.text,
  },
  cursor: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "rgba(59,42,85,0.3)",
  },
  bufferLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: COLORS.buffer,
    opacity: 0.8,
  },
  bufferLabel: {
    position: "absolute",
    right: 0,
    color: COLORS.caution,
    fontSize: 10,
  },
  axisRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  axisText: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 14,
    marginBottom: 4,
  },
  legendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 3,
    marginRight: 6,
  },
  legendText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  insightCard: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#5C2D79",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  insightMark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 1,
  },
  insightMarkText: {
    fontSize: 14,
    fontWeight: "700",
  },
  insightBody: {
    flex: 1,
  },
  insightTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 3,
  },
  insightDetail: {
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
});