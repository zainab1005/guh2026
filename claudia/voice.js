import { Platform } from "react-native";
import * as Speech from "expo-speech"; // npx expo install expo-speech

// ---- Claudia talking (works on phone and web) ----
export function speak(text) {
  try {
    Speech.stop();
    Speech.speak(text, { language: "en-GB", rate: 1.0 });
  } catch (e) {
    console.warn("speak failed", e);
  }
}

export function stopSpeaking() {
  try {
    Speech.stop();
  } catch {}
}

// ---- You talking to Claudia ----
// Browser Web Speech API only (works in the web build, best in Chrome).
// Phone speech recognition needs a custom dev build, so the mic is hidden there.
const SR =
  Platform.OS === "web" && typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

export const canListen = () => !!SR;

// Returns a stop() function.
export function startListening({ onText, onEnd, onError }) {
  const rec = new SR();
  rec.lang = "en-GB";
  rec.interimResults = true;
  rec.continuous = false;
  rec.onresult = (e) => {
    const text = Array.from(e.results)
      .map((r) => r[0].transcript)
      .join("");
    onText(text, e.results[e.results.length - 1].isFinal);
  };
  rec.onend = () => onEnd?.();
  rec.onerror = (ev) => onError?.(ev.error);
  rec.start();
  return () => rec.stop();
}
