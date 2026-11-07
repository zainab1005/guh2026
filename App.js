import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import Login from './pages/login';
import SignUp from './pages/signup';
import Home from './pages/home';
import PlanetPage from './pages/PlanetPage';
import TasksScreen from './pages/TasksScreen';
import ChatbotScreen from './claudia/ClaudiaScreen';
import ChatbotScreen from './pages/ChatbotScreen';
import ForecastPage from './pages/ForecastPage';
import Personalise from './pages/Personalise';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('login'); // 'login', 'signup', 'home', 'forecast', 'insights', 'tasks', 'chatbot', 'planetpage'
  const [currentUser, setCurrentUser] = useState(null);
  const [planetHealth, setPlanetHealth] = useState(100);
  const [userPriorities, setUserPriorities] = useState([]);

  const handleTaskProgress = (percentage) => {
    setPlanetHealth(percentage);
  };

  const navigateToHome = (user) => {
    if (user) setCurrentUser(user);
    setCurrentScreen('home');
  };

  const navigateToTasks = () => setCurrentScreen('tasks');
  const navigateToChatbot = () => setCurrentScreen('chatbot');
  const navigateToForecast = () => setCurrentScreen('forecast');
  const navigateToInsights = () => setCurrentScreen('insights');
  const navigateToSignUp = () => setCurrentScreen('signup');
  const navigateToLogin = () => setCurrentScreen('login');
  
  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentScreen('login');
  };

  // Shared navigation handlers for console toolbar across screens
  const consoleNavigation = {
    onNavigateToHome: () => setCurrentScreen('home'),
    onNavigateToForecast: navigateToForecast,
    onNavigateToChat: navigateToChatbot,
    onNavigateToChatbot: navigateToChatbot,
    onNavigateToInsights: navigateToInsights,
    onNavigateToActions: navigateToTasks,
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

      {currentScreen === 'forecast' && (
        <ForecastPage 
          {...consoleNavigation}
        />
      )}

      {currentScreen === 'insights' && (
        <Personalise 
          priorities={userPriorities}
          onSave={(updatedPriorities) => setUserPriorities(updatedPriorities)}
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