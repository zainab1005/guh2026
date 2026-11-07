import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import BottomConsole from "./BottomConsole";

const COLORS = {
  bg: "#0E1A21",
  surface: "#16262F",
  surfaceAlt: "#1D313C",
  text: "#EAF2EF",
  textMuted: "#8FA7A8",
  accent: "#6FD0C2",
  caution: "#E9B44C",
  info: "#7FB4E8",
  danger: "#E58A8A",
};

const SUGGESTED = [
  { id: "travel", label: "Travel", icon: "✈️" },
  { id: "food", label: "Food", icon: "🍽️" },
  { id: "wellness", label: "Wellness", icon: "🧘" },
  { id: "education", label: "Education", icon: "🎓" },
  { id: "investments", label: "Investments", icon: "📊" },
  { id: "housing", label: "Housing", icon: "🏡" },
  { id: "family", label: "Family", icon: "👨‍👩‍👧" },
  { id: "transport", label: "Transport", icon: "🚌" },
  { id: "entertainment", label: "Entertainment", icon: "🎬" },
  { id: "emergency", label: "Emergency fund", icon: "🛟" },
  { id: "debt", label: "Paying off debt", icon: "💳" },
  { id: "giving", label: "Giving", icon: "🎁" },
];

const LEVELS = ["High", "Medium", "Low"];
const LEVEL_COLOR = {
  High: COLORS.accent,
  Medium: COLORS.info,
  Low: COLORS.textMuted,
};

export default function Personalise({
  priorities: initialPriorities,
  onSave,
  onNavigateToHome,
  onNavigateToForecast,
  onNavigateToChatbot,
  onNavigateToInsights,
  onNavigateToTasks,
}) {
  const [priorities, setPriorities] = useState(initialPriorities || []);
  const [customText, setCustomText] = useState("");
  const [saved, setSaved] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const isSelected = (id) => priorities.some((p) => p.id === id);

  const toggle = (item) => {
    setSaved(false);
    setPriorities((prev) =>
      prev.some((p) => p.id === item.id)
        ? prev.filter((p) => p.id !== item.id)
        : [...prev, { ...item, level: "Medium" }]
    );
  };

  const cycleLevel = (id) => {
    setSaved(false);
    setPriorities((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, level: LEVELS[(LEVELS.indexOf(p.level) + 1) % LEVELS.length] }
          : p
      )
    );
  };

  const remove = (id) => {
    setSaved(false);
    setPriorities((prev) => prev.filter((p) => p.id !== id));
  };

  const addCustom = () => {
    const label = customText.trim();
    if (!label) return;
    const exists = priorities.some(
      (p) => p.label.toLowerCase() === label.toLowerCase()
    );
    if (!exists) {
      setPriorities((prev) => [
        ...prev,
        { id: `custom-${Date.now()}`, label, icon: "⭐", level: "Medium" },
      ]);
      setSaved(false);
    }
    setCustomText("");
  };

  const save = () => {
    if (onSave) onSave(priorities);
    setSaved(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setSaved(false), 2500);
  };

  const customOptions = priorities.filter((p) => p.id.startsWith("custom-"));
  const allOptions = [...SUGGESTED, ...customOptions];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.widget}>
          <Text style={styles.pageTitle}>Your priorities</Text>
          <Text style={styles.intro}>
            Choose what matters most to you. Your assistant uses these to
            shape the actions it suggests and how it reads your spending.
          </Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryNumber}>{priorities.length}</Text>
            <Text style={styles.summaryText}>
              {priorities.length === 1 ? "priority chosen" : "priorities chosen"}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Add a priority</Text>
        <View style={styles.chipWrap}>
          {allOptions.map((item) => {
            const selected = isSelected(item.id);
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => toggle(item)}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text style={styles.chipIcon}>{item.icon}</Text>
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {item.label}
                </Text>
                <Text style={[styles.chipAction, selected && styles.chipTextSelected]}>
                  {selected ? "✓" : "+"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.customRow}>
          <TextInput
            style={styles.input}
            value={customText}
            onChangeText={setCustomText}
            placeholder="Add your own, e.g. Wedding"
            placeholderTextColor={COLORS.textMuted}
            returnKeyType="done"
            onSubmitEditing={addCustom}
          />
          <TouchableOpacity
            style={[styles.addButton, !customText.trim() && styles.addButtonOff]}
            onPress={addCustom}
            disabled={!customText.trim()}
          >
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>How important is each one?</Text>
        {priorities.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              Nothing added yet. Tap a category above to get started.
            </Text>
          </View>
        ) : (
          priorities.map((p) => (
            <View key={p.id} style={styles.row}>
              <Text style={styles.rowIcon}>{p.icon}</Text>
              <Text style={styles.rowLabel}>{p.label}</Text>
              <TouchableOpacity
                onPress={() => cycleLevel(p.id)}
                style={[styles.levelPill, { borderColor: LEVEL_COLOR[p.level] }]}
              >
                <Text style={[styles.levelText, { color: LEVEL_COLOR[p.level] }]}>
                  {p.level}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => remove(p.id)} style={styles.removeButton}>
                <Text style={styles.removeText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
        {priorities.length > 0 && (
          <Text style={styles.hint}>Tap High, Medium or Low to change it.</Text>
        )}

        <TouchableOpacity style={styles.saveButton} onPress={save}>
          <Text style={styles.saveText}>
            {saved ? "Priorities saved" : "Save priorities"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomConsole 
        onNavigateToHome={onNavigateToHome}
        onNavigateToForecast={onNavigateToForecast}
        onNavigateToChatbot={onNavigateToChatbot}
        onNavigateToInsights={onNavigateToInsights}
        onNavigateToTasks={onNavigateToTasks}
      />
    </KeyboardAvoidingView>
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
  },
  pageTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },
  intro: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  summaryNumber: {
    color: COLORS.accent,
    fontSize: 30,
    fontWeight: "700",
    marginRight: 8,
  },
  summaryText: {
    color: COLORS.text,
    fontSize: 15,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 6,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.surfaceAlt,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  chipIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  chipText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
    marginRight: 8,
  },
  chipTextSelected: {
    color: COLORS.bg,
  },
  chipAction: {
    color: COLORS.textMuted,
    fontSize: 15,
    fontWeight: "700",
  },
  customRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 26,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    marginRight: 10,
  },
  addButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  addButtonOff: {
    opacity: 0.4,
  },
  addButtonText: {
    color: COLORS.bg,
    fontSize: 15,
    fontWeight: "700",
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  rowIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  rowLabel: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "600",
  },
  levelPill: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  levelText: {
    fontSize: 13,
    fontWeight: "700",
  },
  removeButton: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  removeText: {
    color: COLORS.textMuted,
    fontSize: 15,
  },
  hint: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
    marginBottom: 6,
  },
  saveButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 18,
  },
  saveText: {
    color: COLORS.bg,
    fontSize: 16,
    fontWeight: "700",
  },
});