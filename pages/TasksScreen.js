import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity,
  ScrollView,
  ImageBackground
} from 'react-native';

export default function TasksScreen({ onBack, onProgressUpdate }) {
  const [tasks, setTasks] = useState({
    water: null,
    meals: null,
    exercise: null,
    sleep: null,
    meditation: null
  });
  const [loading, setLoading] = useState(true);

  const taskDetails = {
    water: { label: 'Drink 8 Glasses of Water', icon: '💧' },
    meals: { label: 'Eat 3 Meals', icon: '🍽️' },
    exercise: { label: 'Exercise 30 Minutes', icon: '🏃' },
    sleep: { label: 'Sleep 7-8 Hours', icon: '😴' },
    meditation: { label: 'Meditate for 10 minutes', icon: '🧘' }
  };

  useEffect(() => {
    loadTodaysTasks();
  }, []);

  const loadTodaysTasks = () => {
    // Tasks now maintain local React state instead of reading from Firestore
    setTasks({
      water: null,
      meals: null,
      exercise: null,
      sleep: null,
      meditation: null
    });
    setLoading(false);
  };

  const toggleTask = (taskKey, newValue) => {
    const updatedTasks = { ...tasks, [taskKey]: newValue };
    setTasks(updatedTasks);
  };

  const getCompletionPercentage = () => {
    const completed = Object.values(tasks).filter(v => v === true).length;
    const percentage = Math.round((completed / 5) * 100);

    if (onProgressUpdate) {
      onProgressUpdate(percentage);
    }
    
    return percentage;
  };

  const renderTaskItem = (taskKey) => {
    const task = taskDetails[taskKey];
    const isCompleted = tasks[taskKey] === true;
    const isIncomplete = tasks[taskKey] === false;

    return (
      <View key={taskKey} style={styles.taskItem}>
        <Text style={styles.taskLabel}>{task.icon} {task.label}</Text>
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[
              styles.statusButton,
              isCompleted && styles.completedButton
            ]}
            onPress={() => toggleTask(taskKey, true)}
          >
            <Text style={[
              styles.statusIcon,
              isCompleted && styles.statusIconActive
            ]}>✓</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.statusButton,
              isIncomplete && styles.incompleteButton
            ]}
            onPress={() => toggleTask(taskKey, false)}
          >
            <Text style={[
              styles.statusIcon,
              isIncomplete && styles.statusIconActive
            ]}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.background, styles.loadingOverlay]}>
        <Text style={styles.loadingText}>Loading tasks from your planet...</Text>
      </View>
    );
  }

  return (
    <ImageBackground
      source={require('../resources/9.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Daily Missions </Text>
          <Text style={styles.dateText}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
          
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              {getCompletionPercentage()}% Progress
            </Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${getCompletionPercentage()}%` }
                ]} 
              />
            </View>
          </View>
        </View>

        <View style={styles.tasksList}>
          {Object.keys(taskDetails).map(taskKey => renderTaskItem(taskKey))}
        </View>

        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Back to Home</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    flexGrow: 1,
    backgroundColor: 'rgba(28, 59, 94, 0.9)',
    paddingBottom: 40,
  },
  loadingOverlay: {
    backgroundColor: 'rgba(28, 59, 94, 1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 30,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#E0F7FA',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  dateText: {
    fontSize: 16,
    color: '#A9D6E5',
    marginBottom: 25,
  },
  progressContainer: {
    marginTop: 15,
    backgroundColor: 'rgba(57, 108, 142, 0.5)',
    padding: 15,
    borderRadius: 12,
  },
  progressText: {
    fontSize: 18,
    color: '#8EE4AF',
    marginBottom: 10,
    fontWeight: '700',
  },
  progressBar: {
    height: 12,
    backgroundColor: '#1C3B5E',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#60B3B0',
    borderRadius: 6,
  },
  tasksList: {
    paddingHorizontal: 30,
    paddingVertical: 10,
  },
  taskItem: {
    backgroundColor: '#396C8E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  taskLabel: {
    fontSize: 17,
    color: '#E0F7FA',
    flex: 1,
    fontWeight: '500',
  },
  buttonGroup: {
    flexDirection: 'row',
  },
  statusButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1C3B5E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#A9D6E5',
    marginLeft: 10,
  },
  completedButton: {
    backgroundColor: '#77DD77',
    borderColor: '#4CAF50',
  },
  incompleteButton: {
    backgroundColor: '#f6e248ff',
    borderColor: '#f6e248ff',
  },
  statusIcon: {
    fontSize: 22,
    color: '#A9D6E5',
    fontWeight: 'bold',
  },
  statusIconActive: {
    color: '#fff',
  },
  backButton: {
    marginHorizontal: 30,
    marginTop: 20,
    backgroundColor: '#60B3B0',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#60B3B0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  backButtonText: {
    color: '#E0F7FA',
    fontSize: 16,
    fontWeight: '700',
  },
  loadingText: {
    color: '#E0F7FA',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
});