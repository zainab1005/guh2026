import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import BottomConsole from './BottomConsole';

export default function Home({ 
    currentUser, 
    onLogout, 
    onNextPage, 
    onNavigateToTasks, 
    onNavigateToChatbot, 
    onNavigateToShop,
    planetHealth 
}) {
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* LIGHT PURPLE HEADER WITH NATWEST LOGO IN THE MIDDLE & EXIT AT TOP RIGHT */}
                <View style={styles.headerCard}>
                    <View style={styles.topHeaderRow}>
                        <View style={styles.headerSpacer} />
                        
                        {/* Local NatWest Logo */}
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

                {/* MAIN CONTENT AREA */}
                <View style={styles.contentArea}>
                    <View style={styles.quickActionBox}>
                        <Text style={styles.sectionTitle}>Dashboard</Text>
                        <Text style={styles.bodyText}>
                            Welcome to your console. Select an option from the bottom menu to view your forecast, talk with Claudia, view insights, or check your daily tasks.
                        </Text>
                    </View>
                </View>

                {/* SEPARATE BOTTOM CONSOLE COMPONENT */}
                <BottomConsole 
                    onNavigateToTasks={onNavigateToTasks}
                    onNavigateToChatbot={onNavigateToChatbot}
                    onNavigateToHome={() => {}}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#7A3E9D',
    },
    container: {
        flex: 1,
        backgroundColor: '#F5F0F8',
    },
    headerCard: {
        backgroundColor: '#7A3E9D',
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
        backgroundColor: '#5C2D79',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    exitButtonText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: '600',
    },
    greetingBox: {
        marginTop: 6,
    },
    welcomeLabel: {
        color: '#E9D7F5',
        fontSize: 15,
    },
    userName: {
        color: '#ffffff',
        fontSize: 26,
        fontWeight: 'bold',
        marginTop: 2,
    },
    healthStatusBox: {
        backgroundColor: '#5C2D79',
        borderRadius: 12,
        padding: 16,
        marginTop: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#FFD700',
    },
    healthLabel: {
        color: '#E9D7F5',
        fontSize: 13,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    healthValue: {
        color: '#ffffff',
        fontSize: 26,
        fontWeight: 'bold',
        marginTop: 4,
    },
    healthTrack: {
        height: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 3,
        marginTop: 10,
        overflow: 'hidden',
    },
    healthFill: {
        height: '100%',
        backgroundColor: '#FFD700',
        borderRadius: 3,
    },
    contentArea: {
        flex: 1,
        padding: 20,
    },
    quickActionBox: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
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
        color: '#5C2D79',
        marginBottom: 8,
    },
    bodyText: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 20,
    },
});