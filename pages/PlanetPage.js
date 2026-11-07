import React, { useState, useEffect } from "react";
import { ImageBackground, StyleSheet, View, Text, TouchableOpacity } from "react-native";

export default function PlanetPage({ 
    health, 
    onNavigateToHome
}) {
    const [backgroundImage, setBackgroundImage] = useState(require("../resources/9.png"));

    const updateHealthImage = (health) => {
        if (health >= 80) return require("../resources/10.png");
        else if (health >= 60) return require("../resources/8.png");
        else if (health >= 40) return require("../resources/6.png");
        else if (health >= 20) return require("../resources/4.png");
        else return require("../resources/2.png");
    };

    useEffect(() => {
        setBackgroundImage(updateHealthImage(health || 0)); 
    }, [health]);

    return (
        <ImageBackground 
            source={backgroundImage} 
            style={styles.background} 
            resizeMode="cover"
        >
            <TouchableOpacity 
                style={styles.backButton} 
                onPress={onNavigateToHome}
            >
                <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        width: "100%",
        height: "100%"
    },
    backButton: {
        position: "absolute",
        top: 40,
        left: 20,
        paddingVertical: 10,
        paddingHorizontal: 15,
        backgroundColor: "rgba(0,0,0,0.5)",
        borderRadius: 10
    },
    backText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
        textDecorationLine: 'underline',
    }
});