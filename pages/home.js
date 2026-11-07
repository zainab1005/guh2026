import React, { useState, useEffect } from "react";
import { ImageBackground, StyleSheet, View, Text, TouchableOpacity } from "react-native";

export default function Home({ 
    currentUser, 
    onLogout, 
    onNextPage, 
    onNavigateToTasks, 
    onNavigateToChatbot, 
    onNavigateToShop,
    planetHealth 
}) {
    const [backgroundImage, setBackgroundImage] = useState(require("../resources/9.png"));

    const updateHealthImage = (planetHealth) => {
        if (planetHealth >= 80) return require("../resources/9.png");
        else if (planetHealth >= 60) return require("../resources/7.png");
        else if (planetHealth >= 40) return require("../resources/5.png");
        else if (planetHealth >= 20) return require("../resources/3.png");
        else return require("../resources/1.png");
    };

    useEffect(() => {
        setBackgroundImage(updateHealthImage(planetHealth));
    }, [planetHealth]);

    const handleNextPage = () => {
        if (onNextPage) {
            onNextPage(planetHealth);
        }
    };

    return (
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={handleNextPage}>
            <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover">
                
                {/* TOP RIGHT ICON CONTAINER: Shop & Exit */}
                <View style={styles.topRightContainer}>
                    <TouchableOpacity 
                        style={styles.topIcon} 
                        onPress={onNavigateToShop}
                    >
                        <Text style={styles.topIconText}> Shop</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[styles.topIcon, { marginLeft: 10 }]} 
                        onPress={onLogout} 
                    >
                        <Text style={styles.topIconText}> Exit</Text>
                    </TouchableOpacity>
                </View>

                {/* MAIN CONTENT */}
                <View style={styles.container}>
                    <Text style={styles.greetingTitle}>Greetings, Voyager!</Text>
                    {currentUser?.planetName && (
                        <Text style={styles.planetName}>Your home is: {currentUser.planetName}</Text>
                    )}
                    
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity 
                            style={styles.button} 
                            onPress={onNavigateToTasks}
                        >
                            <Text style={styles.buttonText}>Daily Tasks</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={styles.button} 
                            onPress={onNavigateToChatbot}
                        >
                            <Text style={styles.buttonText}> Wellness Chat</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ImageBackground>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
    },
    background: {
        flex: 1,
        width: "100%",
        height: "100%"
    },
    topRightContainer: {
        position: 'absolute',
        top: 50,
        right: 20,
        flexDirection: 'row',
        zIndex: 10,
    },
    topIcon: {
        backgroundColor: '#325a6dff',
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#52869eff',
    },
    topIconText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    greetingTitle: {
        fontSize: 48,
        fontWeight: '900',
        color: '#fff',
        marginBottom: 4,
        marginTop: 100,
        textShadowColor: 'rgba(124, 61, 237, 0.7)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 10,
        letterSpacing: 1,
    },
    planetName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#52869eff',
        marginBottom: 30,
    },
    buttonContainer: {
        width: '100%',
        marginBottom: 100,
    },
    button: {
        width: '100%',
        backgroundColor: '#52869eff',
        padding: 18,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 20,
        shadowColor: '#52869eff',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    }
});