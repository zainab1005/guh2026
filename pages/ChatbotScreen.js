import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Linking,
  ImageBackground,
  Alert
} from 'react-native';

const MOCK_TASK_DATA = [
  { type: 'water', value: 2200, goal: 2500, status: 'near-goal' },
  { type: 'sleep', value: 7.2, goal: 8, status: 'partial' },
  { type: 'exercise', value: 45, goal: 30, status: 'complete' },
];
const MOCK_PLANET_HEALTH = 88; 

const getRecentTaskData = async () => {
  return MOCK_TASK_DATA;
};

const mockCurrentUser = {
  planetName: 'Aether',
  uid: 'mock-user-123',
};

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY; 
const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`; 

const calculateMetrics = (taskData) => {
    const data = Array.isArray(taskData) ? taskData : [];
    
    if (data.length === 0) {
        return { context: 'No recent task data available.', rate: 0 };
    }

    const totalPossibleTasks = data.length * 4; 
    const completedTasks = data.reduce((sum, day) => sum + (day.completedCount || 0), 0);
    const completionRate = Math.round((completedTasks / totalPossibleTasks) * 100);
    
    const recentDaysSummary = data.slice(0, 3).map(day => {
        const datePart = (typeof day.date === 'string' && day.date.length > 5) ? day.date.slice(5) : 'Unknown Date';
        return `On ${datePart}, completed ${day.completedCount}/${day.totalCount} tasks.`;
    }).join(' ');

    const context = `User Context: Over the last ${data.length} days, the user has an average wellness task completion rate of ${completionRate}%. Summary of the last few days: ${recentDaysSummary}.`;
    
    return { context, rate: completionRate };
};

const INSIGHT_COMMAND = "INSIGHT";
const MESSAGE_TYPE_INSIGHT = "insight"; 

export default function ChatbotScreen({ onBack, currentUser = mockCurrentUser }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi ${currentUser?.planetName || 'there'}! 🌟 I'm The Cosmos Guide. Ask me anything, or type "${INSIGHT_COMMAND}" to get your daily reflection and travel suggestion!`,
      sources: []
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef();

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const handleInsightRequest = useCallback(async (taskData) => {
      const { rate: completionRate } = calculateMetrics(taskData);
      
      const userQuery = `
      You are Planet Pal, an AI spirit guiding users through wellness, sustainability, and travel discovery.
      The user's planet is named ${currentUser.planetName}.
      Their planet health score is ${MOCK_PLANET_HEALTH}%.
      Their recent task completion rate is ${completionRate}%.

      Your task:
      1. Write ONE motivational reflection (max 25 words) in a friendly, nature-inspired tone.
      2. Suggest ONE real-world travel destination that connects to their current wellness focus.
      3. Include a poetic line tying the destination to their growing planet in the destination description.

      Output format MUST be a strict JSON object:
      {
        "reflection": "...",
        "destination": {
          "name": "...",
          "description": "..."
        }
      }
      `;

      const payload = {
          contents: [{ parts: [{ text: userQuery }] }],
          systemInstruction: { 
              parts: [{ text: "You are Planet Pal. Your SOLE output for this request MUST be a JSON object. Do not add any text outside the JSON block." }] 
          },
      };
      
      const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
          throw new Error(`Gemini API request failed with status: ${response.status}`);
      }
      
      const result = await response.json();
      const aiJsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!aiJsonText) {
          throw new Error('Invalid response structure from Gemini.');
      }
      
      const cleanJson = aiJsonText.replace(/```json|```/g, '').trim();
      return JSON.parse(cleanJson);

  }, [currentUser]);

  const sendMessage = useCallback(async () => {
    if (!inputText.trim() || loading) return;

    if (!apiKey || apiKey === "YOUR_ACTIVE_GEMINI_API_KEY_HERE") {
         Alert.alert(
            "API Key Missing", 
            "The Gemini API key is not set. Please ensure EXPO_PUBLIC_GEMINI_API_KEY is defined in your .env file."
        );
        return;
    }

    const userMessage = inputText.trim();
    setInputText('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage, sources: [] }]);
    setLoading(true);
    
    try {
      const taskData = await getRecentTaskData();
      const { context: contextMessage, rate: completionRate } = calculateMetrics(taskData);
      
      const isInsightCommand = userMessage.toUpperCase() === INSIGHT_COMMAND;

      if (isInsightCommand) {
          const insightData = await handleInsightRequest(taskData);
          setMessages(prev => [...prev, {
              role: 'assistant',
              type: MESSAGE_TYPE_INSIGHT,
              insight: insightData,
              content: 'Your daily insight is ready!',
          }]);
      } else {
          const systemPrompt = `You are a friendly, highly supportive and motivating AI Wellness Coach called "The Cosmos Guide". 
          Your purpose is to provide personalized encouragement and advice. Always reference the user's **${completionRate}% completion rate** when discussing progress. CONTEXT: ${contextMessage}`;
          
          const chatHistory = messages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
          })).concat([
            { role: 'user', parts: [{ text: userMessage }] }
          ]);
          
          const payload = {
            contents: chatHistory,
            systemInstruction: { parts: [{ text: systemPrompt }] }
          };

          const response = await fetch(apiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });
          
          if (!response.ok) throw new Error(`API request failed with status: ${response.status}`);

          const result = await response.json();
          const assistantMessage = result.candidates?.[0]?.content?.parts?.[0]?.text || "Error generating response.";
          
          setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage, sources: [] }]);
      }

    } catch (error) {
      console.error('Error in send message process:', error);
      Alert.alert('AI Connection Error', error.message);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm sorry, I couldn't process that request right now. 😥",
        sources: []
      }]);
    } finally {
      setLoading(false);
    }
  }, [inputText, loading, messages, handleInsightRequest]);
  
  const handleOpenBookingLink = (destinationName) => {
      const searchUrl = `https://www.booking.com/searchresults.en-us.html?ss=${encodeURIComponent(destinationName)}`;
      Linking.openURL(searchUrl).catch(err => {
        console.error("Failed to open link:", err);
        Alert.alert("Link Error", "Could not open the travel suggestion link.");
      });
  };

  const renderMessage = (message, index) => {
    const isUser = message.role === 'user';
    
    if (message.type === MESSAGE_TYPE_INSIGHT) {
        const insight = message.insight;
        if (!insight || !insight.destination) return null;

        return (
            <View key={index} style={[styles.messageBubble, styles.insightBubble]}>
                <Text style={styles.insightHeader}>✨ Your Daily Cosmic Insight ✨</Text>
                
                <Text style={styles.insightReflectionText}>
                    "{insight.reflection}"
                </Text>
                
                <TouchableOpacity 
                    style={styles.insightDestinationBox} 
                    onPress={() => handleOpenBookingLink(insight.destination.name)}
                >
                    <Text style={styles.insightDestinationName}>✈️ {insight.destination.name}</Text>
                    <Text style={styles.insightDestinationDescription}>
                        {insight.destination.description}
                    </Text>
                    <Text style={styles.bookingLinkText}>Tap to explore destinations →</Text>
                </TouchableOpacity>
            </View>
        );
    }
    
    return (
      <View 
        key={index} 
        style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.assistantBubble
        ]}
      >
        <Text style={[
          styles.messageText,
          isUser ? styles.userText : styles.assistantText
        ]}>
          {message.content}
        </Text>
      </View>
    );
  };

  return (
    <ImageBackground
      source={{ uri: 'https://placehold.co/1000x1000/1C3B5E/FFFFFF/png?text=🌌' }} 
      style={styles.background}
      resizeMode="cover"
    >
      <KeyboardAvoidingView 
        style={styles.contentWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>The Cosmos Guide</Text>
        </View>

        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={scrollToBottom}
        >
          {messages.map((message, index) => renderMessage(message, index))}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#8EE4AF" />
              <Text style={styles.loadingText}>Guide is thinking...</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder={`Ask me anything, or type "${INSIGHT_COMMAND}"...`}
            placeholderTextColor="#A9D6E5"
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity 
            style={[styles.sendButton, (!inputText.trim() || loading) && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim() || loading}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: '100%', height: '100%', },
  contentWrapper: { flex: 1, backgroundColor: 'rgba(28, 59, 94, 0.9)', },
  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, backgroundColor: '#1C3B5E', borderBottomWidth: 1, borderBottomColor: 'rgba(96, 179, 176, 0.5)', },
  backButton: { marginBottom: 10, },
  backButtonText: { color: '#8EE4AF', fontSize: 16, fontWeight: '600', },
  title: { fontSize: 24, fontWeight: 'bold', color: '#E0F7FA', },
  messagesContainer: { flex: 1, },
  messagesContent: { padding: 20, paddingBottom: 10, },
  messageBubble: { maxWidth: '85%', padding: 14, borderRadius: 18, marginBottom: 12, },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#FFB347', borderBottomRightRadius: 6, },
  assistantBubble: { alignSelf: 'flex-start', backgroundColor: '#396C8E', borderBottomLeftRadius: 6, },
  messageText: { fontSize: 15, lineHeight: 22, },
  userText: { color: '#1C3B5E', fontWeight: '500', },
  assistantText: { color: '#E0F7FA', },
  insightBubble: {
    alignSelf: 'center',
    maxWidth: '95%',
    backgroundColor: '#396C8E',
    borderColor: '#8EE4AF',
    borderWidth: 2,
    padding: 20,
    borderRadius: 18,
  },
  insightHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8EE4AF',
    marginBottom: 10,
    textAlign: 'center',
  },
  insightReflectionText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#E0F7FA',
    marginBottom: 15,
    textAlign: 'center',
    lineHeight: 24,
  },
  insightDestinationBox: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#1C3B5E',
    borderLeftWidth: 4,
    borderLeftColor: '#FFB347',
    alignItems: 'center',
  },
  insightDestinationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFB347',
    marginBottom: 5,
  },
  insightDestinationDescription: {
    fontSize: 14,
    color: '#A9D6E5',
    textAlign: 'center',
    marginBottom: 8,
  },
  bookingLinkText: {
    fontSize: 12,
    color: '#60B3B0',
    fontWeight: '700',
  },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#396C8E', padding: 12, borderRadius: 18, marginBottom: 12, },
  loadingText: { color: '#8EE4AF', marginLeft: 8, fontSize: 14, },
  inputContainer: { flexDirection: 'row', padding: 16, backgroundColor: '#1C3B5E', borderTopWidth: 1, borderTopColor: 'rgba(96, 179, 176, 0.5)', alignItems: 'flex-end', },
  input: { flex: 1, backgroundColor: '#1C3B5E', borderRadius: 25, paddingHorizontal: 18, paddingVertical: 12, paddingTop: 12, color: '#E0F7FA', fontSize: 15, maxHeight: 100, marginRight: 12, borderWidth: 1, borderColor: '#396C8E', textAlignVertical: 'top', },
  sendButton: { backgroundColor: '#60B3B0', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25, justifyContent: 'center', height: 48, width: 65, },
  sendButtonDisabled: { backgroundColor: 'rgba(57, 108, 142, 0.5)', opacity: 1, },
  sendButtonText: { color: '#E0F7FA', fontSize: 15, fontWeight: '700', },
});