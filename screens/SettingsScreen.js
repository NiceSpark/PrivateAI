import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SettingsManager } from '../managers/SettingsManager';

export default function SettingsScreen({ navigation }) {
    const [publicKey, setPublicKey] = useState('');
    const [targetUrl, setTargetUrl] = useState('');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const key = await SettingsManager.getPublicKey();
        const url = await SettingsManager.getTargetUrl();
        if (key) setPublicKey(key);
        if (url) setTargetUrl(url);
    };

    const saveSettings = async () => {
        await SettingsManager.savePublicKey(publicKey);
        await SettingsManager.saveTargetUrl(targetUrl);
        Alert.alert('Success', 'Settings saved successfully');
        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>

                    <View style={styles.headerRow}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={28} color="#FFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Settings</Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.label}>GCP Endpoint URL</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="https://..."
                            placeholderTextColor="#666"
                            value={targetUrl}
                            onChangeText={setTargetUrl}
                            autoCapitalize="none"
                            keyboardType="url"
                        />
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.label}>RSA Public Key (PEM)</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="-----BEGIN PUBLIC KEY-----..."
                            placeholderTextColor="#666"
                            value={publicKey}
                            onChangeText={setPublicKey}
                            multiline
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <Text style={styles.hint}>Paste your public key here to enable hybrid encryption.</Text>
                    </View>

                    <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
                        <Text style={styles.saveButtonText}>Save Configuration</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    scrollContent: {
        padding: 20,
        paddingTop: 40,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFF',
        color: '#FFF',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 40,
    },
    backButton: {
        marginRight: 15,
    },
    section: {
        marginBottom: 25,
    },
    label: {
        fontSize: 16,
        color: '#BBB',
        marginBottom: 10,
        fontWeight: '600',
    },
    input: {
        backgroundColor: '#1E1E1E',
        color: '#FFF',
        padding: 15,
        borderRadius: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    textArea: {
        height: 200,
        textAlignVertical: 'top',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 12,
    },
    hint: {
        color: '#666',
        fontSize: 12,
        marginTop: 8,
    },
    saveButton: {
        backgroundColor: '#0984E3',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
    },
    saveButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
