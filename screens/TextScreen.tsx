import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, SafeAreaView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Uploader } from '../services/Uploader';

import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../App';

type Props = StackScreenProps<RootStackParamList, 'Text'>;

export default function TextScreen({ navigation }: Props) {
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!text.trim()) return;

        setLoading(true);
        try {
            await Uploader.uploadText(text);
            Alert.alert('Success', 'Note encrypted and sent securelly.');
            setText('');
            navigation.goBack();
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={styles.content}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={28} color="#FFF" />
                        </TouchableOpacity>
                        <Text style={styles.title}>New Note</Text>
                    </View>

                    <TextInput
                        style={styles.input}
                        placeholder="Type your secret note here..."
                        placeholderTextColor="#666"
                        value={text}
                        onChangeText={setText}
                        multiline
                        autoFocus
                        textAlignVertical="top"
                    />

                    <TouchableOpacity
                        style={[styles.sendButton, (!text.trim() || loading) && styles.disabledButton]}
                        onPress={handleSend}
                        disabled={!text.trim() || loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.sendButtonText}>Encrypt & Send</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFF',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 10,
    },
    backButton: {
        marginRight: 15,
    },
    input: {
        flex: 1,
        backgroundColor: '#1E1E1E',
        color: '#FFF',
        padding: 20,
        borderRadius: 16,
        fontSize: 18,
        marginBottom: 20,
        textAlignVertical: 'top',
    },
    sendButton: {
        backgroundColor: '#6C5CE7',
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 10,
    },
    disabledButton: {
        backgroundColor: '#333',
        opacity: 0.7,
    },
    sendButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
