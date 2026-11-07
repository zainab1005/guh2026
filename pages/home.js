import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ScrollView,
} from 'react-native';
import BottomConsole from './BottomConsole';
import { mockUser } from '../claudia/mockData';

const COLORS = {
  header: '#CDB9EA',
  bg: '#F4EFFA',
  surface: '#FFFFFF',
  surfaceAlt: '#EADFF6',
  text: '#3B2A55',
  textSoft: '#5B4A78',
  textMuted: '#7D6F96',
  green: '#2F6B4A',
  greenSoft: '#DCEBE2',
  gold: '#F2B93B',
  goldSoft: '#FBEFD0',
  border: '#E4D8F2',
};

const MOODS = [
  { emoji: '😌', label: 'Chill' },
  { emoji: '🙂', label: 'Fine' },
  { emoji: '😬', label: 'Tight' },
  { emoji: '🤑', label: 'Flush' },
];

const TIPS = [
  'Got a big payday? Put 20% in your buffer before you spend a penny. Future you says thanks.',
  'A coffee you love is money well spent. A coffee on autopilot is not. Ask Claudia which one it is.',
  'Quiet week? Check the Forecast, because knowing beats worrying.',
  'Rent is due soon? Claudia can tell you what is truly safe to spend until then.',
  'Spend more on what matters to you. Set your priorities in Personalise and Claudia will use them.',
  'Small wins count. Saved £5 today? That is a plane ticket in progress.',
];

const money = (n) => `£${Math.round(n).toLocaleString('en-GB')}`;

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good morning,', emoji: '☀️' };
  if (h < 18) return { text: 'Good afternoon,', emoji: '🌤️' };
  return { text: 'Good evening,', emoji: '🌙' };
}

export default function Home({
  currentUser,
  onLogout,
  onNavigateToHome,
  onNavigateToForecast,
  onNavigateToChat,
  onNavigateToChatbot,
  onNavigateToInsights,
  onNavigateToTasks,
  planetHealth,
}) {
  const handleChat = onNavigateToChatbot || onNavigateToChat;
  const [mood, setMood] = useState(null);
  const [tipIndex, setTipIndex] = useState(new Date().getDate() % TIPS.length);
  const hello = greeting();

  const { safeToSpend, bills, goal } = useMemo(() => {
    const due = mockUser.bills.filter((b) => b.dueInDays <= 14).reduce((s, b) => s + b.amount, 0);
    return {
      safeToSpend: Math.max(0, mockUser.balance - due - 20),
      bills: [...mockUser.bills].sort((a, b) => a.dueInDays - b.dueInDays).slice(0, 3),
      goal: mockUser.goals[0],
    };
  }, []);

  const goalPct = Math.min(100, Math.round((goal.saved / goal.target) * 100));
  const wellness = typeof planetHealth === 'number' ? planetHealth : 0;
  const askChips = ['☕ Can I buy a coffee?', '👟 New trainers?', '✈️ Save for Lisbon?'];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerCard}>
          <View style={styles.topHeaderRow}>
            <View style={styles.headerSpacer} />

            <Image
              source={require('../resources/natwest_logo.jpg')}
              style={styles.logo}
              resizeMode="contain"
            />

            <TouchableOpacity style={styles.exitButton} onPress={onLogout}>
              <Text style={styles.exitButtonText}>Exit 🚪</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.greetingBox}>
            <Text style={styles.welcomeLabel}>
              {hello.emoji} {hello.text}
            </Text>
            <Text style={styles.userName}>{currentUser?.displayName || 'User'}</Text>
          </View>

          <View style={styles.healthStatusBox}>
            <Text style={styles.healthLabel}>Wellness Score</Text>
            <Text style={styles.healthValue}>{wellness}%</Text>
            <View style={styles.healthTrack}>
              <View style={[styles.healthFill, { width: `${wellness}%` }]} />
            </View>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.contentArea}
          showsVerticalScrollIndicator={false}
        >
          {/* Claudia hello card */}
          <TouchableOpacity style={styles.claudiaCard} onPress={handleChat} activeOpacity={0.85}>
            <View style={styles.claudiaLogoTile}>
              <Image
                source={require('../resources/claudia_logo.png')}
                style={styles.claudiaLogo}
                resizeMode="contain"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.claudiaTitle}>Ask Claudia anything</Text>
              <Text style={styles.claudiaSub}>
                Thinking of buying something? Let's check it against what matters to you.
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <View style={styles.chipRow}>
            {askChips.map((c) => (
              <TouchableOpacity key={c} style={styles.chip} onPress={handleChat}>
                <Text style={styles.chipText}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Safe to spend */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.sectionTitle}>Safe to spend</Text>
              <View style={styles.pill}>
                <Text style={styles.pillText}>🔥 3 day streak</Text>
              </View>
            </View>
            <Text style={styles.bigNumber}>{money(safeToSpend)}</Text>
            <Text style={styles.bodyText}>
              That is what is left after your bills for the next 2 weeks and a small buffer.
            </Text>
          </View>

          {/* Mood check-in */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>How are you feeling about money?</Text>
            <View style={styles.moodRow}>
              {MOODS.map((m, i) => (
                <TouchableOpacity
                  key={m.label}
                  style={[styles.moodBtn, mood === i && styles.moodBtnActive]}
                  onPress={() => setMood(i)}
                >
                  <Text style={styles.moodEmoji}>{m.emoji}</Text>
                  <Text style={[styles.moodLabel, mood === i && styles.moodLabelActive]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {mood !== null && (
              <Text style={styles.moodReply}>
                {mood === 2
                  ? 'Thanks for telling me. Check the Forecast and we will find some breathing room together.'
                  : mood === 3
                  ? 'Nice! Maybe put a little towards your goal before it disappears 😉'
                  : 'Good to know. Claudia has your back either way.'}
              </Text>
            )}
          </View>

          {/* Goal */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>✈️ {goal.name}</Text>
            <View style={styles.goalNumbers}>
              <Text style={styles.goalSaved}>{money(goal.saved)}</Text>
              <Text style={styles.goalTarget}> of {money(goal.target)}</Text>
            </View>
            <View style={styles.goalTrack}>
              <View style={[styles.goalFill, { width: `${goalPct}%` }]} />
              <Text style={[styles.plane, { left: `${Math.min(goalPct, 92)}%` }]}>✈️</Text>
            </View>
            <Text style={styles.bodyText}>{goalPct}% there. Keep going!</Text>
          </View>

          {/* Bill countdown */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>🗓️ Coming up</Text>
            {bills.map((b) => (
              <View key={b.name} style={styles.billRow}>
                <View style={[styles.daysBadge, b.dueInDays <= 7 && styles.daysBadgeSoon]}>
                  <Text style={[styles.daysNum, b.dueInDays <= 7 && styles.daysNumSoon]}>
                    {b.dueInDays}
                  </Text>
                  <Text style={[styles.daysLabel, b.dueInDays <= 7 && styles.daysNumSoon]}>days</Text>
                </View>
                <Text style={styles.billName}>{b.name}</Text>
                <Text style={styles.billAmount}>{money(b.amount)}</Text>
              </View>
            ))}
          </View>

          {/* Tip of the day */}
          <TouchableOpacity
            style={styles.tipCard}
            activeOpacity={0.85}
            onPress={() => setTipIndex((tipIndex + 1) % TIPS.length)}
          >
            <Text style={styles.tipTitle}>💡 Claudia's tip</Text>
            <Text style={styles.tipText}>{TIPS[tipIndex]}</Text>
            <Text style={styles.tipHint}>Tap for another</Text>
          </TouchableOpacity>
        </ScrollView>

        <BottomConsole
          active="home"
          onNavigateToHome={onNavigateToHome}
          onNavigateToForecast={onNavigateToForecast}
          onNavigateToChatbot={handleChat}
          onNavigateToInsights={onNavigateToInsights}
          onNavigateToTasks={onNavigateToTasks}
        />
      </View>
    </SafeAreaView>
  );
}

const shadow = {
  shadowColor: '#5C2D79',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 2,
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.header },
  container: { flex: 1, backgroundColor: COLORS.bg },
  headerCard: {
    backgroundColor: COLORS.header,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerSpacer: { width: 60 },
  logo: { width: 130, height: 36 },
  exitButton: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  exitButtonText: { color: COLORS.text, fontSize: 13, fontWeight: '600' },
  greetingBox: { marginTop: 6 },
  welcomeLabel: { color: COLORS.textSoft, fontSize: 15 },
  userName: { color: COLORS.text, fontSize: 26, fontWeight: 'bold', marginTop: 2 },
  healthStatusBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.green,
  },
  healthLabel: { color: COLORS.textMuted, fontSize: 13, letterSpacing: 0.3 },
  healthValue: { color: COLORS.text, fontSize: 26, fontWeight: 'bold', marginTop: 4 },
  healthTrack: {
    height: 6,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 3,
    marginTop: 10,
    overflow: 'hidden',
  },
  healthFill: { height: '100%', backgroundColor: COLORS.green, borderRadius: 3 },

  contentArea: { padding: 20, paddingBottom: 30 },

  claudiaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.green,
    borderRadius: 18,
    padding: 14,
    ...shadow,
  },
  claudiaLogoTile: {
    width: 62,
    height: 62,
    borderRadius: 16,
    backgroundColor: '#F9FAF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  claudiaLogo: { width: 54, height: 54 },
  claudiaTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  claudiaSub: { color: '#DCEBE2', fontSize: 13, lineHeight: 18, marginTop: 3 },
  chevron: { color: '#FFFFFF', fontSize: 30, marginLeft: 6 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, marginBottom: 4 },
  chip: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: { color: COLORS.text, fontSize: 13, fontWeight: '600' },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 18,
    marginTop: 12,
    ...shadow,
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: COLORS.text, marginBottom: 6 },
  bodyText: { fontSize: 14, color: COLORS.textMuted, lineHeight: 20 },
  bigNumber: { fontSize: 38, fontWeight: 'bold', color: COLORS.green, marginVertical: 4 },
  pill: {
    backgroundColor: COLORS.goldSoft,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginBottom: 6,
  },
  pillText: { color: '#8A5A00', fontSize: 12, fontWeight: '700' },

  moodRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  moodBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    marginHorizontal: 3,
    borderRadius: 14,
    backgroundColor: COLORS.bg,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  moodBtnActive: { borderColor: COLORS.green, backgroundColor: COLORS.greenSoft },
  moodEmoji: { fontSize: 26 },
  moodLabel: { fontSize: 12, color: COLORS.textMuted, marginTop: 4, fontWeight: '600' },
  moodLabelActive: { color: COLORS.green },
  moodReply: { marginTop: 12, fontSize: 14, color: COLORS.textSoft, lineHeight: 20 },

  goalNumbers: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 10 },
  goalSaved: { fontSize: 26, fontWeight: 'bold', color: COLORS.text },
  goalTarget: { fontSize: 14, color: COLORS.textMuted },
  goalTrack: {
    height: 10,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 5,
    marginBottom: 12,
    justifyContent: 'center',
  },
  goalFill: { height: '100%', backgroundColor: COLORS.green, borderRadius: 5 },
  plane: { position: 'absolute', fontSize: 18, top: -12 },

  billRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  daysBadge: {
    width: 48,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceAlt,
    marginRight: 12,
  },
  daysBadgeSoon: { backgroundColor: COLORS.goldSoft },
  daysNum: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  daysNumSoon: { color: '#8A5A00' },
  daysLabel: { fontSize: 10, color: COLORS.textMuted },
  billName: { flex: 1, fontSize: 15, color: COLORS.text, fontWeight: '600' },
  billAmount: { fontSize: 15, color: COLORS.text, fontWeight: '700' },

  tipCard: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 16,
    padding: 18,
    marginTop: 12,
  },
  tipTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.text, marginBottom: 6 },
  tipText: { fontSize: 14, color: COLORS.textSoft, lineHeight: 21 },
  tipHint: { fontSize: 12, color: COLORS.textMuted, marginTop: 8 },
});
