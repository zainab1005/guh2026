import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

const COLORS = {
  bar: '#D9C9EF',
  barBorder: 'rgba(59, 42, 85, 0.12)',
  ring: '#F4EFFA',
  label: '#4A3768',
  green: '#2F6B4A',
  white: '#FFFFFF',
};

// active (optional): 'home' | 'forecast' | 'insights' | 'tasks'
export default function BottomConsole({
  active,
  onNavigateToHome,
  onNavigateToForecast,
  onNavigateToChatbot,
  onNavigateToInsights,
  onNavigateToTasks,
}) {
  const labelStyle = (key) => [styles.navLabel, active === key && styles.navLabelActive];

  return (
    <View style={styles.bottomConsole}>
      <TouchableOpacity style={styles.navButton} onPress={onNavigateToHome || (() => {})}>
        <Text style={styles.navIcon}>🏠</Text>
        <Text style={labelStyle('home')}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navButton} onPress={onNavigateToForecast || (() => {})}>
        <Text style={styles.navIcon}>📈</Text>
        <Text style={labelStyle('forecast')}>Forecast</Text>
      </TouchableOpacity>

      {/* CLAUDIA BUTTON */}
      <TouchableOpacity style={styles.claudiaNavButton} onPress={onNavigateToChatbot || (() => {})}>
        <View style={styles.claudiaCircle}>
          <Text style={styles.claudiaIcon}>💬</Text>
        </View>
        <Text style={styles.claudiaNavLabel}>Claudia</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navButton} onPress={onNavigateToInsights || (() => {})}>
        <Text style={styles.navIcon}>💡</Text>
        <Text style={labelStyle('insights')} numberOfLines={1} adjustsFontSizeToFit>
          Personalise
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navButton} onPress={onNavigateToTasks || (() => {})}>
        <Text style={styles.navIcon}>📋</Text>
        <Text style={labelStyle('tasks')}>Tasks</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomConsole: {
    flexDirection: 'row',
    backgroundColor: COLORS.bar,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.barBorder,
    justifyContent: 'space-around',
    alignItems: 'flex-end',
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingBottom: 4,
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  navLabel: {
    color: COLORS.label,
    fontSize: 11,
    fontWeight: '600',
  },
  navLabelActive: {
    color: COLORS.green,
    fontWeight: '800',
  },
  claudiaNavButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1.2,
    marginTop: -16,
  },
  claudiaCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.green,
    borderWidth: 3,
    borderColor: COLORS.ring,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.green,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 5,
  },
  claudiaIcon: {
    fontSize: 24,
  },
  claudiaNavLabel: {
    color: COLORS.green,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
});