import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  ImageBackground,
} from 'react-native';

const COLORS = {
  overlay: 'rgba(74, 55, 104, 0.68)',
  input: '#FFFFFF',
  inputText: '#3B2A55',
  placeholder: '#8A7CA3',
  green: '#2F6B4A',
  link: '#EADFF6',
};

export default function LoginScreen({ onNavigateToSignUp, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    // Bypass database check and trigger successful login state
    onLoginSuccess({
      email: email,
      planetName: 'My Planet',
      displayName: email.split('@')[0],
      userId: 'mock-user-id-123',
    });
    Alert.alert('Success', 'Logged in!');
  };

  return (
    <ImageBackground
      source={require('../resources/9.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Planet Pal</Text>
        <Text style={styles.subtitle}>Welcome Back</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={COLORS.placeholder}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={COLORS.placeholder}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onNavigateToSignUp}>
          <Text style={styles.link}>Don't have an account? Sign up</Text>
        </TouchableOpacity>
      </View>
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
    flex: 1,
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.link,
    marginBottom: 32,
  },
  input: {
    width: '100%',
    backgroundColor: COLORS.input,
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    fontSize: 16,
    color: COLORS.inputText,
  },
  button: {
    width: '100%',
    backgroundColor: COLORS.green,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    color: COLORS.link,
    marginTop: 20,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});