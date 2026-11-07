import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

export default function BottomConsole({ 
    onNavigateToTasks, 
    onNavigateToChatbot, 
    onNavigateToForecast, 
    onNavigateToInsights,
    onNavigateToHome 
}) {
    return (
        <View style={styles.bottomConsole}>
            <TouchableOpacity style={styles.navButton} onPress={onNavigateToHome || (() => {})}>
                <Text style={styles.navIcon}>🏠</Text>
                <Text style={styles.navLabel}>Home</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navButton} onPress={onNavigateToForecast || (() => {})}>
                <Text style={styles.navIcon}>📈</Text>
                <Text style={styles.navLabel}>Forecast</Text>
            </TouchableOpacity>

            {/* CLAUDIA BUTTON WITH GOLD RING */}
            <TouchableOpacity style={styles.claudiaNavButton} onPress={onNavigateToChatbot}>
                <View style={styles.goldCircle}>
                    <Text style={styles.claudiaIcon}>💬</Text>
                </View>
                <Text style={styles.claudiaNavLabel}>Claudia</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navButton} onPress={onNavigateToInsights || (() => {})}>
                <Text style={styles.navIcon}>💡</Text>
                <Text style={styles.navLabel}>Insights</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navButton} onPress={onNavigateToTasks}>
                <Text style={styles.navIcon}>📋</Text>
                <Text style={styles.navLabel}>Tasks</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    bottomConsole: {
        flexDirection: 'row',
        backgroundColor: '#7A3E9D',
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.15)',
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
        color: '#ffffff',
        fontSize: 11,
        fontWeight: '600',
    },
    claudiaNavButton: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1.2,
        marginTop: -16,
    },
    goldCircle: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#5C2D79',
        borderWidth: 3,
        borderColor: '#FFD700',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 5,
    },
    claudiaIcon: {
        fontSize: 24,
    },
    claudiaNavLabel: {
        color: '#FFD700',
        fontSize: 12,
        fontWeight: '700',
        marginTop: 4,
    },
});