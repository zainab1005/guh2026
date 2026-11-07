import { Platform } from "react-native";
import Constants from "expo-constants";

const PORT = 8787;

// Where the Claudia server lives.
// - Web build: localhost
// - Phone (Expo Go): same machine that serves the Expo bundle, found automatically
// - Override with EXPO_PUBLIC_CLAUDIA_URL=http://<ip>:8787 if that guess is wrong
function resolveUrl() {
  if (process.env.EXPO_PUBLIC_CLAUDIA_URL) return process.env.EXPO_PUBLIC_CLAUDIA_URL;
  if (Platform.OS === "web") return `http://localhost:${PORT}`;
  const hostUri = Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost;
  const ip = hostUri?.split(":")[0];
  return `http://${ip || "localhost"}:${PORT}`;
}

export const CLAUDIA_URL = resolveUrl();
