import { hybridEncrypt } from './Encryption';
import { SettingsManager } from '../managers/SettingsManager';
// import * as FileSystem from 'expo-file-system'; // Deprecated reading method avoided
import { Platform } from 'react-native';

export const Uploader = {
    uploadText: async (text: string): Promise<any> => {
        try {
            const publicKey = await SettingsManager.getPublicKey();
            const targetUrl = await SettingsManager.getTargetUrl();
            const authSecret = await SettingsManager.getAuthSecret();

            if (!publicKey || !targetUrl) {
                throw new Error('Missing configuration: Public Key or Target URL');
            }

            const encryptedPayload = await hybridEncrypt(text, publicKey);

            const headers: any = {
                'Content-Type': 'application/json',
            };
            if (authSecret) {
                headers['X-Auth-Secret'] = authSecret;
            }

            const response = await fetch(targetUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    type: 'text',
                    payload: encryptedPayload,
                    timestamp: new Date().toISOString(),
                }),
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.statusText}`);
            }

            return await response.json();
        } catch (error: any) {
            console.error('Upload Text Error:', error);
            throw error;
        }
    },

    uploadAudio: async (uri: string): Promise<any> => {
        try {
            const publicKey = await SettingsManager.getPublicKey();
            const targetUrl = await SettingsManager.getTargetUrl();
            const authSecret = await SettingsManager.getAuthSecret();

            if (!publicKey || !targetUrl) {
                throw new Error('Missing configuration: Public Key or Target URL');
            }

            let fileContent: string;

            // Use generic fetch + blob for both Web and Native (expo-file-system check avoidance)
            // fetch supports file:// URIs on Native (and blob() works with polyfills in Expo)
            const response = await fetch(uri);
            const blob = await response.blob();

            // Convert blob to base64
            fileContent = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64data = reader.result as string;
                    // Remove prefix like "data:audio/webm;base64," if present
                    const parts = base64data.split(',');
                    const content = parts.length > 1 ? parts[1] : base64data;
                    resolve(content);
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });

            const encryptedPayload = await hybridEncrypt(fileContent, publicKey);

            const headers: any = {
                'Content-Type': 'application/json',
            };
            if (authSecret) {
                headers['X-Auth-Secret'] = authSecret;
            }

            const response2 = await fetch(targetUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    type: 'audio',
                    payload: encryptedPayload,
                    timestamp: new Date().toISOString(),
                    encoding: 'base64', // hint that the decrypted data is base64 audio
                }),
            });

            if (!response2.ok) {
                throw new Error(`Upload failed: ${response2.statusText}`);
            }

            return await response2.json();
        } catch (error: any) {
            console.error('Upload Audio Error:', error);
            throw error;
        }
    },
};
