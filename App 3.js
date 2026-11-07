import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import Login from './pages/login';
import SignUp from './pages/signup';
import Home from './pages/home';
import PlanetPage from './pages/PlanetPage';
import TasksScreen from './pages/TasksScreen';
import ChatbotScreen from './claudia/ClaudiaScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('login'); // 'login', 'signup', 'home'
  const [currentUser, setCurrentUser] = useState(null);
  const [planetHealth, setPlanetHealth] = useState(100);

  const handleTaskProgress = (percentage) => {
    setPlanetHealth(percentage);
  };

  const navigateToNext = (healthValue) => {
    setPlanetHealth(healthValue);
    setCurrentScreen('planetpage');
  };

  const navigateToChatbot = () => {
    setCurrentScreen('chatbot');
  };

  const navigateToSignUp = () => setCurrentScreen('signup');
  const navigateToLogin = () => setCurrentScreen('login');
  
  const navigateToHome = (user) => {
    if (user) {
      setCurrentUser(user);
    }
    setCurrentScreen('home');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentScreen('login');
  };

  const navigateToTasks = () => {
    setCurrentScreen('tasks');
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
          onNextPage={navigateToNext}
          onNavigateToTasks={navigateToTasks}
          onNavigateToChatbot={navigateToChatbot}
          planetHealth={planetHealth}          
          setHealth={setPlanetHealth} 
        />
      )}

      {currentScreen === 'tasks' && (
        <TasksScreen 
          onBack={() => setCurrentScreen('home')}
          onProgressUpdate={handleTaskProgress} 
        />
      )}

      {currentScreen === 'planetpage' && (
        <PlanetPage 
          health={planetHealth} 
          setHealth={setPlanetHealth} 
          onNavigateToHome={navigateToHome}
        />
      )}

      {currentScreen === 'chatbot' && (
        <ChatbotScreen 
          onBack={navigateToHome}
          currentUser={currentUser}
        />
      )}

      <StatusBar style="auto" />
    </>
  );
}