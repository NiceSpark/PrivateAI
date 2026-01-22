import { hybridEncrypt } from './Encryption';
import { SettingsManager } from '../managers/SettingsManager';
import * as FileSystem from 'expo-file-system';

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

            // Read file as base64
            const fileContent = await FileSystem.readAsStringAsync(uri, {
                encoding: 'base64',
            });

            const encryptedPayload = await hybridEncrypt(fileContent, publicKey);

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
        } catch (error: any) {
            console.error('Upload Audio Error:', error);
            throw error;
        }
    },
};
