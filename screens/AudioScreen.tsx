import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { Uploader } from '../services/Uploader';

import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../App';

type Props = StackScreenProps<RootStackParamList, 'Audio'>;

export default function AudioScreen({ navigation }: Props) {
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [permissionResponse, requestPermission] = Audio.usePermissions();
    const [isRecording, setIsRecording] = useState(false);
    const [loading, setLoading] = useState(false);
    const [recordedUri, setRecordedUri] = useState<string | null>(null);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState('00:00');

    useEffect(() => {
        // Cleanup on unmount
        return () => {
            if (recording) {
                recording.stopAndUnloadAsync();
            }
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, [recording, sound]);

    // Simple timer effect
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRecording) {
            const start = Date.now();
            interval = setInterval(() => {
                const ms = Date.now() - start;
                const s = Math.floor(ms / 1000);
                const m = Math.floor(s / 60);
                const sec = s % 60;
                setDuration(`${m < 10 ? '0' + m : m}:${sec < 10 ? '0' + sec : sec}`);
            }, 1000);
        } else if (!recordedUri) {
            setDuration('00:00');
        }
        return () => clearInterval(interval);
    }, [isRecording, recordedUri]);

    async function startRecording() {
        try {
            // Reset state
            setRecordedUri(null);
            if (sound) {
                await sound.unloadAsync();
                setSound(null);
            }
            setIsPlaying(false);

            if (permissionResponse?.status !== 'granted') {
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
        if (!recording) return;
        setIsRecording(false);
        try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            if (uri) {
                setRecordedUri(uri);
            }
            setRecording(null);
            await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
        } catch (error) {
            console.error('Failed to stop recording', error);
        }
    }

    async function playSound() {
        if (!recordedUri) return;
        try {
            if (sound) {
                await sound.unloadAsync();
            }
            const { sound: newSound } = await Audio.Sound.createAsync({ uri: recordedUri });
            setSound(newSound);
            setIsPlaying(true);

            newSound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) {
                    setIsPlaying(false);
                }
            });

            await newSound.playAsync();
        } catch (error) {
            console.error('Failed to play sound', error);
            Alert.alert('Error', 'Could not play audio');
        }
    }

    async function handleRetake() {
        setRecordedUri(null);
        setDuration('00:00');
        if (sound) {
            await sound.unloadAsync();
            setSound(null);
        }
    }

    const sendAudio = async () => {
        if (!recordedUri) return;
        setLoading(true);
        try {
            await Uploader.uploadAudio(recordedUri);
            Alert.alert('Success', 'Audio encrypted and sent securely.');
            navigation.goBack();
        } catch (error: any) {
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
                        <>
                            {!recordedUri ? (
                                <View style={{ alignItems: 'center' }}>
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
                                    <Text style={styles.instruction}>
                                        {isRecording ? 'Tap to Stop' : 'Tap to Record'}
                                    </Text>
                                </View>
                            ) : (
                                <View style={styles.reviewContainer}>
                                    <TouchableOpacity style={styles.actionButton} onPress={playSound}>
                                        <Ionicons name={isPlaying ? "pause" : "play"} size={32} color="white" />
                                        <Text style={styles.actionText}>{isPlaying ? "Playing..." : "Play Check"}</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={[styles.actionButton, styles.sendButton]} onPress={sendAudio}>
                                        <Ionicons name="send" size={32} color="white" />
                                        <Text style={styles.actionText}>Encrypt & Send</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={[styles.actionButton, styles.retakeButton]} onPress={handleRetake}>
                                        <Ionicons name="trash" size={24} color="#FF5252" />
                                        <Text style={[styles.actionText, { color: '#FF5252' }]}>Retake</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </>
                    )}
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
    reviewContainer: {
        width: '100%',
        alignItems: 'center',
        gap: 20,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#333',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 30,
        minWidth: 200,
        justifyContent: 'center',
        marginBottom: 10,
    },
    sendButton: {
        backgroundColor: '#0984E3',
    },
    retakeButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#FF5252',
    },
    actionText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 10,
    },
});
