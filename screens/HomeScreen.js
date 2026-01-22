import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Assuming Expo includes this

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>PrivateAI</Text>
                <TouchableOpacity
                    style={styles.settingsButton}
                    onPress={() => navigation.navigate('Settings')}
                >
                    <Ionicons name="settings-sharp" size={24} color="#E0E0E0" />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <TouchableOpacity
                    style={[styles.card, styles.textCard]}
                    onPress={() => navigation.navigate('Text')}
                >
                    <Ionicons name="create-outline" size={48} color="#FFFFFF" />
                    <Text style={styles.cardTitle}>New Note</Text>
                    <Text style={styles.cardSubtitle}>Type and encrypt</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.card, styles.audioCard]}
                    onPress={() => navigation.navigate('Audio')}
                >
                    <Ionicons name="mic-outline" size={48} color="#FFFFFF" />
                    <Text style={styles.cardTitle}>Record Audio</Text>
                    <Text style={styles.cardSubtitle}>Capture and encrypt</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 40,
        paddingBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        letterSpacing: 1,
    },
    settingsButton: {
        padding: 10,
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
    },
    content: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        gap: 20,
    },
    card: {
        flex: 1,
        maxHeight: 250,
        borderRadius: 24,
        padding: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    textCard: {
        backgroundColor: '#6C5CE7', // Modern Purple
    },
    audioCard: {
        backgroundColor: '#00CEC9', // Modern Cyan
    },
    cardTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFF',
        marginTop: 15,
    },
    cardSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 5,
    },
});
