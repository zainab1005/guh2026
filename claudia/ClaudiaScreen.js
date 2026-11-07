import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { CLAUDIA_URL } from "./config";
import { mockUser } from "./mockData";
import { speak, stopSpeaking, canListen, startListening } from "./voice";

const VERDICTS = {
  buy: { label: "Go for it", color: "#2E9E6B", emoji: "✅" },
  wait: { label: "Hold off", color: "#E0A030", emoji: "⏳" },
  skip: { label: "Skip it", color: "#D9534F", emoji: "🚫" },
  swap: { label: "Try instead", color: "#3B82C4", emoji: "🔄" },
  info: { label: "", color: "#6B7280", emoji: "" },
};

const SUGGESTIONS = [
  "Should I buy a £3.50 coffee?",
  "£60 trainers today?",
  "Can I afford a £120 weekend trip?",
];

/**
 * Props:
 *  - onBack(): optional, shows a Back button
 *  - userData: optional, defaults to the mock persona (see mockData.js for the shape)
 */
export default function ClaudiaScreen({ onBack, userData = mockUser }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      isGreeting: true,
      content: `Hey ${userData.name || "there"}! I'm Claudia. Ask me before you spend, like "should I grab a coffee?", and I'll check it against what matters to you.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [listening, setListening] = useState(false);
  const [safeToSpend, setSafeToSpend] = useState(null);
  const [serverDown, setServerDown] = useState(false);
  const scrollRef = useRef();
  const stopListenRef = useRef(null);
  const sendRef = useRef(null);

  // Load the safe-to-spend number for the header (also tells us if the server is reachable).
  useEffect(() => {
    fetch(`${CLAUDIA_URL}/context`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userData }),
    })
      .then((r) => r.json())
      .then((c) => {
        setSafeToSpend(c.safeToSpend);
        setServerDown(false);
      })
      .catch(() => setServerDown(true));
  }, [userData]);

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
          body: JSON.stringify({ messages: history, userData }),
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
    [input, loading, messages, userData, voiceOn]
  );
  sendRef.current = send;

  const toggleMic = () => {
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
          <View style={[styles.verdictPill, { backgroundColor: v.color }]}>
            <Text style={styles.verdictText}>
              {v.emoji} {v.label}
            </Text>
          </View>
        ) : null}
        <Text style={[styles.msgText, isUser && styles.userText]}>{m.content}</Text>
        {d && d.verdict !== "info" && d.price > 0 ? (
          <View style={styles.numbers}>
            <Text style={styles.numbersText}>
              £{d.price.toFixed(2)} · safe to spend after:{" "}
              <Text style={{ fontWeight: "700" }}>£{d.safeToSpendAfter.toFixed(2)}</Text>
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
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
    >
      <View style={styles.header}>
        {onBack ? (
          <TouchableOpacity onPress={() => onBack()}>
            <Text style={styles.back}>← Back</Text>
          </TouchableOpacity>
        ) : null}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Claudia</Text>
            <Text style={styles.tagline}>Spend more on what actually matters to you</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              if (voiceOn) stopSpeaking();
              setVoiceOn(!voiceOn);
            }}
          >
            <Text style={styles.speaker}>{voiceOn ? "🔊" : "🔇"}</Text>
          </TouchableOpacity>
        </View>
        {safeToSpend != null ? (
          <View style={styles.safeChip}>
            <Text style={styles.safeLabel}>Safe to spend now</Text>
            <Text style={styles.safeValue}>£{safeToSpend.toFixed(2)}</Text>
          </View>
        ) : null}
        {serverDown ? (
          <Text style={styles.warn}>Can't reach Claudia's server at {CLAUDIA_URL}. Is `npm start` running in /server?</Text>
        ) : null}
      </View>

      <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={styles.list}>
        {messages.map(renderMessage)}
        {loading ? (
          <View style={[styles.bubble, styles.botBubble, { flexDirection: "row", alignItems: "center" }]}>
            <ActivityIndicator size="small" color="#2E9E6B" />
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
            <Text style={{ fontSize: 20 }}>{listening ? "🛑" : "🎤"}</Text>
          </TouchableOpacity>
        ) : null}
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder={listening ? "Listening..." : "Should I buy...?"}
          placeholderTextColor="#9AA3AF"
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
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F6F4EE" },
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 14, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#E6E2D8" },
  back: { color: "#2E9E6B", fontSize: 16, fontWeight: "600", marginBottom: 6 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 28, fontWeight: "800", color: "#1F2937" },
  tagline: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  speaker: { fontSize: 24 },
  safeChip: { marginTop: 12, alignSelf: "flex-start", backgroundColor: "#E8F5EE", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  safeLabel: { fontSize: 11, color: "#2E7D5B", fontWeight: "600" },
  safeValue: { fontSize: 22, fontWeight: "800", color: "#1F6B4A" },
  warn: { marginTop: 10, color: "#B45309", fontSize: 12 },
  list: { padding: 16, paddingBottom: 8 },
  bubble: { maxWidth: "88%", padding: 14, borderRadius: 18, marginBottom: 10 },
  botBubble: { alignSelf: "flex-start", backgroundColor: "#FFFFFF", borderBottomLeftRadius: 6 },
  userBubble: { alignSelf: "flex-end", backgroundColor: "#2E9E6B", borderBottomRightRadius: 6 },
  errorBubble: { backgroundColor: "#FDECEA" },
  msgText: { fontSize: 15, lineHeight: 22, color: "#1F2937" },
  userText: { color: "#FFFFFF", fontWeight: "500" },
  verdictPill: { alignSelf: "flex-start", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 8 },
  verdictText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
  numbers: { marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#EEE9DD" },
  numbersText: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  suggestions: { marginTop: 6 },
  suggestion: { alignSelf: "flex-start", backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#D9D4C5", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 9, marginBottom: 8 },
  suggestionText: { color: "#374151", fontSize: 14 },
  inputRow: { flexDirection: "row", alignItems: "center", padding: 12, paddingBottom: 24, backgroundColor: "#FFFFFF", borderTopWidth: 1, borderTopColor: "#E6E2D8" },
  micBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#F0EDE4", alignItems: "center", justifyContent: "center", marginRight: 8 },
  micOn: { backgroundColor: "#FBD5D3" },
  input: { flex: 1, backgroundColor: "#F6F4EE", borderRadius: 22, paddingHorizontal: 16, paddingVertical: 11, fontSize: 15, color: "#1F2937" },
  sendBtn: { marginLeft: 8, backgroundColor: "#2E9E6B", borderRadius: 22, paddingHorizontal: 18, height: 44, justifyContent: "center" },
  sendText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
});
