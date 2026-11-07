import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import BottomConsole from "../pages/BottomConsole";
import { CLAUDIA_URL } from "./config";
import { mockUser } from "./mockData";
import { speak, stopSpeaking, canListen, startListening, useNativeRecorder, transcribe } from "./voice";

// Same palette as the home page
const C = {
  purple: "#7A3E9D",
  dark: "#5C2D79",
  bg: "#F5F0F8",
  lavender: "#E9D7F5",
  gold: "#FFD700",
  text: "#4B5563",
  ink: "#2D1B3D",
};

const VERDICTS = {
  buy: { label: "Go for it", bg: "#2E9E6B", fg: "#FFFFFF", emoji: "✅" },
  wait: { label: "Hold off", bg: C.gold, fg: C.dark, emoji: "⏳" },
  skip: { label: "Skip it", bg: "#D9534F", fg: "#FFFFFF", emoji: "🚫" },
  swap: { label: "Try instead", bg: C.dark, fg: "#FFFFFF", emoji: "🔄" },
  info: { label: "", bg: C.dark, fg: "#FFFFFF", emoji: "" },
};

const SUGGESTIONS = [
  "Should I buy a £3.50 coffee?",
  "£60 trainers today?",
  "Can I afford a £120 weekend trip?",
];

// ---- Insights page -> Claudia ----
// The Insights page gives a list like [{id, label, icon, level: "High" | "Medium" | "Low"}].
// Claudia's server wants weights that add up to 1, plus the levels themselves.
const LEVEL_VALUE = { High: 3, Medium: 2, Low: 1 };
const keyFor = (p) => (String(p.id).startsWith("custom-") ? p.label.toLowerCase() : p.id);

function fromInsights(list) {
  if (!Array.isArray(list) || list.length === 0) return null;
  const total = list.reduce((s, p) => s + (LEVEL_VALUE[p.level] || 2), 0);
  const priorities = {};
  const priorityLevels = {};
  list.forEach((p) => {
    priorities[keyFor(p)] = Math.round(((LEVEL_VALUE[p.level] || 2) / total) * 100) / 100;
    priorityLevels[keyFor(p)] = p.level || "Medium";
  });
  return { priorities, priorityLevels };
}

// Keeps the conversation when you switch tabs and come back.
let cachedMessages = null;

/**
 * Props (all passed from App.js):
 *  - priorities: the list saved on the Insights page
 *  - currentUser, plus the bottom bar handlers (onNavigateToHome, ...Forecast, ...Chatbot, ...Insights, ...Tasks)
 *  - userData: optional, defaults to the demo persona (see mockData.js)
 */
export default function ClaudiaScreen({
  priorities: insightList = [],
  currentUser,
  userData = mockUser,
  onNavigateToHome,
  onNavigateToForecast,
  onNavigateToChatbot,
  onNavigateToInsights,
  onNavigateToTasks,
}) {
  const name = currentUser?.displayName || userData.name || "there";

  const insight = useMemo(() => fromInsights(insightList), [insightList]);
  const effectiveUser = useMemo(
    () => (insight ? { ...userData, priorities: insight.priorities, priorityLevels: insight.priorityLevels } : userData),
    [userData, insight]
  );
  const topPriorities = useMemo(
    () =>
      [...(insightList || [])]
        .sort((a, b) => (LEVEL_VALUE[b.level] || 2) - (LEVEL_VALUE[a.level] || 2))
        .slice(0, 3)
        .map((p) => `${p.icon || ""} ${p.label}`.trim())
        .join("  ·  "),
    [insightList]
  );

  const [messages, setMessages] = useState(
    cachedMessages || [
      {
        role: "assistant",
        isGreeting: true,
        content: `Hey ${name}! I'm Claudia. Ask me before you spend, like "should I grab a coffee?", and I'll check it against what matters to you.`,
      },
    ]
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [safeToSpend, setSafeToSpend] = useState(null);
  const [serverDown, setServerDown] = useState(false);
  const [kbOpen, setKbOpen] = useState(false);
  const scrollRef = useRef();
  const stopListenRef = useRef(null);
  const sendRef = useRef(null);
  const nativeRec = useNativeRecorder();

  useEffect(() => {
    cachedMessages = messages;
  }, [messages]);

  // Hide the bottom bar while the keyboard is up, like most chat apps
  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () => setKbOpen(true));
    const hide = Keyboard.addListener("keyboardDidHide", () => setKbOpen(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  // Safe-to-spend for the header (also tells us if the server is reachable)
  useEffect(() => {
    fetch(`${CLAUDIA_URL}/context`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userData: effectiveUser }),
    })
      .then((r) => r.json())
      .then((c) => {
        setSafeToSpend(c.safeToSpend);
        setServerDown(false);
      })
      .catch(() => setServerDown(true));
  }, [effectiveUser]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages, loading]);

  const send = useCallback(
    async (override) => {
      const text = (typeof override === "string" ? override : input).trim();
      if (!text || loading) return;
      setInput("");
      const next = [...messages, { role: "user", content: text }];
      setMessages(next);
      setLoading(true);
      try {
        const history = next
          .filter((m) => !m.isGreeting && !m.isError)
          .slice(-12)
          .map((m) => ({ role: m.role, content: m.content }));
        const res = await fetch(`${CLAUDIA_URL}/claudia`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history, userData: effectiveUser }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Server error ${res.status}`);
        }
        const d = await res.json();
        setServerDown(false);
        setSafeToSpend(d.safeToSpend);
        setMessages((p) => [...p, { role: "assistant", content: d.reply, decision: d }]);
        if (voiceOn) speak(d.reply);
      } catch (e) {
        console.warn("Claudia error", e);
        setMessages((p) => [
          ...p,
          { role: "assistant", isError: true, content: `I couldn't reach my brain just now (${e.message}).` },
        ]);
        if (String(e.message).includes("Network") || String(e.message).includes("fetch")) setServerDown(true);
      } finally {
        setLoading(false);
      }
    },
    [input, loading, messages, effectiveUser, voiceOn]
  );
  sendRef.current = send;

  const toggleMic = async () => {
    // ---- Phone: tap to record, tap again to stop, then transcribe on the server and send ----
    if (Platform.OS !== "web") {
      if (transcribing) return;
      try {
        if (!listening) {
          stopSpeaking();
          await nativeRec.start();
          setListening(true);
        } else {
          setListening(false);
          setTranscribing(true);
          const uri = await nativeRec.stop();
          const text = await transcribe(uri, CLAUDIA_URL);
          setTranscribing(false);
          if (text) sendRef.current(text);
          else setMessages((p) => [...p, { role: "assistant", isError: true, content: "I didn't catch that. Try again?" }]);
        }
      } catch (e) {
        setListening(false);
        setTranscribing(false);
        setMessages((p) => [...p, { role: "assistant", isError: true, content: `Voice input problem: ${e.message}` }]);
      }
      return;
    }

    // ---- Web: browser speech recognition ----
    if (listening) {
      stopListenRef.current?.();
      return;
    }
    stopSpeaking();
    setListening(true);
    stopListenRef.current = startListening({
      onText: (text, isFinal) => {
        setInput(text);
        if (isFinal) sendRef.current(text);
      },
      onEnd: () => setListening(false),
      onError: () => setListening(false),
    });
  };

  const renderMessage = (m, i) => {
    const isUser = m.role === "user";
    const d = m.decision;
    const v = d && VERDICTS[d.verdict];
    return (
      <View key={i} style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble, m.isError && styles.errorBubble]}>
        {v && v.label ? (
          <View style={[styles.verdictPill, { backgroundColor: v.bg }]}>
            <Text style={[styles.verdictText, { color: v.fg }]}>
              {v.emoji} {v.label}
            </Text>
          </View>
        ) : null}
        <Text style={[styles.msgText, isUser && styles.userText]}>{m.content}</Text>
        {d && d.verdict !== "info" && d.price > 0 ? (
          <View style={styles.numbers}>
            <Text style={styles.numbersText}>
              £{d.price.toFixed(2)} · safe to spend after:{" "}
              <Text style={{ fontWeight: "700", color: C.dark }}>£{d.safeToSpendAfter.toFixed(2)}</Text>
            </Text>
            {d.matchedPriority && d.matchedPriority !== "none" ? (
              <Text style={styles.numbersText}>Fits your priority: {d.matchedPriority}</Text>
            ) : null}
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Purple header, same look as the home page */}
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.welcomeLabel}>Your financial buddy</Text>
              <Text style={styles.title}>Claudia</Text>
            </View>
            <TouchableOpacity
              style={styles.speakerBtn}
              onPress={() => {
                if (voiceOn) stopSpeaking();
                setVoiceOn(!voiceOn);
              }}
            >
              <Text style={styles.speakerText}>{voiceOn ? "🔊 On" : "🔇 Off"}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.safeBox}>
            <Text style={styles.safeLabel}>Safe to spend now</Text>
            <Text style={styles.safeValue}>{safeToSpend != null ? `£${safeToSpend.toFixed(2)}` : "…"}</Text>
            <Text style={styles.tagline}>Spend more on what actually matters to you</Text>
          </View>
          {serverDown ? (
            <Text style={styles.warn}>Can't reach Claudia's server at {CLAUDIA_URL}. Is it running in /server?</Text>
          ) : null}
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          {/* Shows that Claudia is using the Insights page */}
          <TouchableOpacity style={styles.insightStrip} onPress={onNavigateToInsights} activeOpacity={0.8}>
            <Text style={styles.insightText} numberOfLines={2}>
              {insight
                ? `💡 Using your priorities: ${topPriorities}  ·  Edit`
                : "💡 Using sample priorities. Set yours in Insights →"}
            </Text>
          </TouchableOpacity>

          <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
            {messages.map(renderMessage)}
            {loading ? (
              <View style={[styles.bubble, styles.botBubble, { flexDirection: "row", alignItems: "center" }]}>
                <ActivityIndicator size="small" color={C.purple} />
                <Text style={[styles.msgText, { marginLeft: 8 }]}>Claudia is thinking...</Text>
              </View>
            ) : null}
            {messages.length <= 1 ? (
              <View style={styles.suggestions}>
                {SUGGESTIONS.map((s) => (
                  <TouchableOpacity key={s} style={styles.suggestion} onPress={() => send(s)}>
                    <Text style={styles.suggestionText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.inputRow}>
            {canListen() ? (
              <TouchableOpacity style={[styles.micBtn, listening && styles.micOn]} onPress={toggleMic}>
                <Text style={{ fontSize: 20 }}>{transcribing ? "⏳" : listening ? "🛑" : "🎤"}</Text>
              </TouchableOpacity>
            ) : null}
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder={transcribing ? "Transcribing..." : listening ? "Listening... tap 🛑 when done" : "Should I buy...?"}
              placeholderTextColor="#9CA3AF"
              onSubmitEditing={() => send()}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || loading) && { opacity: 0.4 }]}
              disabled={!input.trim() || loading}
              onPress={() => send()}
            >
              <Text style={styles.sendText}>Ask</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        {!kbOpen ? (
          <BottomConsole
            onNavigateToHome={onNavigateToHome}
            onNavigateToForecast={onNavigateToForecast}
            onNavigateToChatbot={onNavigateToChatbot}
            onNavigateToInsights={onNavigateToInsights}
            onNavigateToTasks={onNavigateToTasks}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.purple },
  container: { flex: 1, backgroundColor: C.bg },
  headerCard: {
    backgroundColor: C.purple,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 18,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  welcomeLabel: { color: C.lavender, fontSize: 15 },
  title: { color: "#FFFFFF", fontSize: 26, fontWeight: "bold", marginTop: 2 },
  speakerBtn: {
    backgroundColor: C.dark,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  speakerText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
  safeBox: {
    backgroundColor: C.dark,
    borderRadius: 12,
    padding: 14,
    marginTop: 14,
    borderLeftWidth: 4,
    borderLeftColor: C.gold,
  },
  safeLabel: { color: C.lavender, fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5 },
  safeValue: { color: "#FFFFFF", fontSize: 26, fontWeight: "bold", marginTop: 2 },
  tagline: { color: C.lavender, fontSize: 12, marginTop: 4 },
  warn: { marginTop: 10, color: C.gold, fontSize: 12 },

  insightStrip: {
    backgroundColor: C.lavender,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  insightText: { color: C.dark, fontSize: 13, fontWeight: "600", lineHeight: 18 },

  list: { padding: 16, paddingBottom: 8 },
  bubble: { maxWidth: "88%", padding: 14, borderRadius: 16, marginBottom: 10 },
  botBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 4,
    shadowColor: C.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  userBubble: { alignSelf: "flex-end", backgroundColor: C.purple, borderBottomRightRadius: 4 },
  errorBubble: { backgroundColor: "#FDECEA" },
  msgText: { fontSize: 15, lineHeight: 22, color: C.ink },
  userText: { color: "#FFFFFF", fontWeight: "500" },
  verdictPill: { alignSelf: "flex-start", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 8 },
  verdictText: { fontWeight: "700", fontSize: 13 },
  numbers: { marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.lavender },
  numbersText: { fontSize: 12, color: C.text, marginTop: 2 },

  suggestions: { marginTop: 6 },
  suggestion: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: C.lavender,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginBottom: 8,
  },
  suggestionText: { color: C.dark, fontSize: 14, fontWeight: "500" },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: C.lavender,
  },
  micBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.lavender,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  micOn: { backgroundColor: C.gold },
  input: {
    flex: 1,
    backgroundColor: C.bg,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 11,
    fontSize: 15,
    color: C.ink,
  },
  sendBtn: { marginLeft: 8, backgroundColor: C.purple, borderRadius: 22, paddingHorizontal: 18, height: 44, justifyContent: "center" },
  sendText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
});
