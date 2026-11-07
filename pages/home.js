import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import BottomConsole from './BottomConsole';

const COLORS = {
  header: '#CDB9EA',
  bg: '#F4EFFA',
  surface: '#FFFFFF',
  surfaceAlt: '#EADFF6',
  text: '#3B2A55',
  textSoft: '#5B4A78',
  textMuted: '#7D6F96',
  green: '#2F6B4A',
  border: '#E4D8F2',
};

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
            <Text style={styles.welcomeLabel}>Good day,</Text>
            <Text style={styles.userName}>{currentUser?.displayName || 'User'}</Text>
          </View>

          <View style={styles.healthStatusBox}>
            <Text style={styles.healthLabel}>Wellness Score</Text>
            <Text style={styles.healthValue}>{planetHealth}%</Text>
            <View style={styles.healthTrack}>
              <View style={[styles.healthFill, { width: `${planetHealth}%` }]} />
            </View>
          </View>
        </View>

        <View style={styles.contentArea}>
          <View style={styles.quickActionBox}>
            <Text style={styles.sectionTitle}>Dashboard</Text>
            <Text style={styles.bodyText}>
              Welcome to your console. Select an option from the bottom menu to view your forecast, talk with Claudia, view insights, or check your daily tasks.
            </Text>
          </View>
        </View>

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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.header,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
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
  headerSpacer: {
    width: 60,
  },
  logo: {
    width: 130,
    height: 36,
  },
  exitButton: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  exitButtonText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
  greetingBox: {
    marginTop: 6,
  },
  welcomeLabel: {
    color: COLORS.textSoft,
    fontSize: 15,
  },
  userName: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: 'bold',
    marginTop: 2,
  },
  healthStatusBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.green,
  },
  healthLabel: {
    color: COLORS.textMuted,
    fontSize: 13,
    letterSpacing: 0.3,
  },
  healthValue: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: 'bold',
    marginTop: 4,
  },
  healthTrack: {
    height: 6,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 3,
    marginTop: 10,
    overflow: 'hidden',
  },
  healthFill: {
    height: '100%',
    backgroundColor: COLORS.green,
    borderRadius: 3,
  },
  contentArea: {
    flex: 1,
    padding: 20,
  },
  quickActionBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#5C2D79',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  bodyText: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
  },
});