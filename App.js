import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import Login from './pages/login';
import SignUp from './pages/signup';
import Home from './pages/home';
import PlanetPage from './pages/PlanetPage';
import TasksScreen from './pages/TasksScreen';
import ChatbotScreen from './pages/ChatbotScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
  const [planetHealth, setPlanetHealth] = useState(100);

  const handleTaskProgress = (percentage) => {
    setPlanetHealth(percentage);
  };

  const navigateToHome = (user) => {
    if (user) setCurrentUser(user);
    setCurrentScreen('home');
  };

  const navigateToTasks = () => setCurrentScreen('tasks');
  const navigateToChatbot = () => setCurrentScreen('chatbot');
  const navigateToPlanet = () => setCurrentScreen('planetpage');
  const navigateToSignUp = () => setCurrentScreen('signup');
  const navigateToLogin = () => setCurrentScreen('login');
  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentScreen('login');
  };

  // Shared navigation handlers for the BottomConsole component across pages
  const consoleNavigation = {
    onNavigateToHome: () => setCurrentScreen('home'),
    onNavigateToForecast: () => setCurrentScreen('planetpage'),
    onNavigateToChatbot: navigateToChatbot,
    onNavigateToInsights: () => setCurrentScreen('planetpage'),
    onNavigateToTasks: navigateToTasks,
  };

  return (
    <>
      {currentScreen === 'login' && (
        <Login 
          onNavigateToSignUp={navigateToSignUp}
          onLoginSuccess={navigateToHome}
        />
      )}

      {currentScreen === 'signup' && (
        <SignUp 
          onNavigateToLogin={navigateToLogin}
          onSignUpSuccess={navigateToHome}
        />
      )}

      {currentScreen === 'home' && (
        <Home 
          currentUser={currentUser}
          onLogout={handleLogout}
          planetHealth={planetHealth}          
          {...consoleNavigation}
        />
      )}

      {currentScreen === 'tasks' && (
        <TasksScreen 
          onBack={() => setCurrentScreen('home')}
          onProgressUpdate={handleTaskProgress} 
          {...consoleNavigation}
        />
      )}

      {currentScreen === 'planetpage' && (
        <PlanetPage 
          health={planetHealth} 
          setHealth={setPlanetHealth} 
          onNavigateToHome={() => setCurrentScreen('home')}
          {...consoleNavigation}
        />
      )}

      {currentScreen === 'chatbot' && (
        <ChatbotScreen 
          onBack={() => setCurrentScreen('home')}
          currentUser={currentUser}
          {...consoleNavigation}
        />
      )}

      <StatusBar style="auto" />
    </>
  );
}