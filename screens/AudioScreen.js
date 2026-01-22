import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { Uploader } from '../services/Uploader';

export default function AudioScreen({ navigation }) {
    const [recording, setRecording] = useState(null);
    const [permissionResponse, requestPermission] = Audio.usePermissions();
    const [isRecording, setIsRecording] = useState(false);
    const [loading, setLoading] = useState(false);
    const [duration, setDuration] = useState('00:00');

    useEffect(() => {
        // Cleanup on unmount
        return () => {
            if (recording) {
                recording.stopAndUnloadAsync();
            }
        };
    }, []);

    // Simple timer effect
    useEffect(() => {
        let interval;
        if (isRecording) {
            const start = Date.now();
            interval = setInterval(() => {
                const ms = Date.now() - start;
                const s = Math.floor(ms / 1000);
                const m = Math.floor(s / 60);
                const sec = s % 60;
                setDuration(`${m < 10 ? '0' + m : m}:${sec < 10 ? '0' + sec : sec}`);
            }, 1000);
        } else {
            setDuration('00:00');
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    async function startRecording() {
        try {
            if (permissionResponse.status !== 'granted') {
                const resp = await requestPermission();
                if (resp.status !== 'granted') return;
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            setRecording(recording);
            setIsRecording(true);
        } catch (err) {
            console.error('Failed to start recording', err);
            Alert.alert('Error', 'Failed to start recording');
        }
    }

    async function stopRecording() {
        setIsRecording(false);
        if (!recording) return;

        await recording.stopAndUnloadAsync();
        await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
        });

        // Auto send
        const uri = recording.getURI();
        sendAudio(uri);
        setRecording(null);
    }

    const sendAudio = async (uri) => {
        setLoading(true);
        try {
            await Uploader.uploadAudio(uri);
            Alert.alert('Success', 'Audio encrypted and sent securely.');
            navigation.goBack();
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={28} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Voice Note</Text>
                </View>

                <View style={styles.statusContainer}>
                    <Text style={styles.timer}>{duration}</Text>
                    <Text style={styles.statusText}>{isRecording ? 'Recording...' : 'Ready'}</Text>
                </View>

                <View style={styles.controls}>
                    {loading ? (
                        <ActivityIndicator size="large" color="#00CEC9" />
                    ) : (
                        <TouchableOpacity
                            style={[styles.recordButton, isRecording ? styles.recording : null]}
                            onPress={isRecording ? stopRecording : startRecording}
                        >
                            <Ionicons
                                name={isRecording ? "stop" : "mic"}
                                size={48}
                                color="white"
                            />
                        </TouchableOpacity>
                    )}

                    <Text style={styles.instruction}>
                        {isRecording ? 'Tap to Stop & Send' : 'Tap to Record'}
                    </Text>
                </View>
            </View>
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
        justifyContent: 'space-between',
        padding: 30,
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFF',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        width: '100%',
    },
    backButton: {
        marginRight: 15,
    },
    statusContainer: {
        alignItems: 'center',
    },
    timer: {
        fontSize: 64,
        fontWeight: '200',
        color: '#FFF',
        fontVariant: ['tabular-nums'],
    },
    statusText: {
        fontSize: 18,
        color: '#00CEC9',
        marginTop: 10,
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    controls: {
        alignItems: 'center',
        marginBottom: 40,
    },
    recordButton: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#444',
    },
    recording: {
        backgroundColor: '#FF5252',
        borderColor: '#FF1744',
    },
    instruction: {
        color: '#888',
        marginTop: 20,
        fontSize: 16,
    },
});
