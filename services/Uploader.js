import { hybridEncrypt } from './Encryption';
import { SettingsManager } from '../managers/SettingsManager';
import * as FileSystem from 'expo-file-system';

export const Uploader = {
    uploadText: async (text) => {
        try {
            const publicKey = await SettingsManager.getPublicKey();
            const targetUrl = await SettingsManager.getTargetUrl();

            if (!publicKey || !targetUrl) {
                throw new Error('Missing configuration: Public Key or Target URL');
            }

            const encryptedPayload = await hybridEncrypt(text, publicKey);

            const response = await fetch(targetUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
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
        } catch (error) {
            console.error('Upload Text Error:', error);
            throw error;
        }
    },

    uploadAudio: async (uri) => {
        try {
            const publicKey = await SettingsManager.getPublicKey();
            const targetUrl = await SettingsManager.getTargetUrl();

            if (!publicKey || !targetUrl) {
                throw new Error('Missing configuration: Public Key or Target URL');
            }

            // Read file as base64
            const fileContent = await FileSystem.readAsStringAsync(uri, {
                encoding: FileSystem.EncodingType.Base64,
            });

            const encryptedPayload = await hybridEncrypt(fileContent, publicKey);

            const response = await fetch(targetUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'audio',
                    payload: encryptedPayload,
                    timestamp: new Date().toISOString(),
                    encoding: 'base64', // hint that the decrypted data is base64 audio
                }),
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Upload Audio Error:', error);
            throw error;
        }
    },
};
