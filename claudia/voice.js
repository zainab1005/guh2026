import { Platform } from "react-native";
import * as Speech from "expo-speech"; // npx expo install expo-speech
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder } from "expo-audio"; // npx expo install expo-audio

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

// Web: browser speech recognition. Phone: record audio and transcribe on the server.
export const canListen = () => Platform.OS !== "web" || !!SR;

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

// ---- Phone: record, then send to the server for transcription ----
export function useNativeRecorder() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const start = async () => {
    const { granted } = await AudioModule.requestRecordingPermissionsAsync();
    if (!granted) throw new Error("Microphone permission was denied");
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
  };
  const stop = async () => {
    await recorder.stop();
    // Back to playback mode so Claudia's spoken replies come out of the speaker, not the earpiece.
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    return recorder.uri;
  };
  return { start, stop };
}

export async function transcribe(uri, baseUrl) {
  const audio = await (await fetch(uri)).blob();
  const res = await fetch(`${baseUrl}/transcribe`, {
    method: "POST",
    headers: { "Content-Type": "audio/mp4" },
    body: audio,
  });
  const d = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(d.error || `Transcription failed (${res.status})`);
  return d.text || "";
}
