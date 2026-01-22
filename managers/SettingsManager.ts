import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
    PUBLIC_KEY: 'privateai_public_key',
    TARGET_URL: 'privateai_target_url',
};

export const SettingsManager = {
    savePublicKey: async (pem: string): Promise<void> => {
        try {
            await AsyncStorage.setItem(KEYS.PUBLIC_KEY, pem);
        } catch (e) {
            console.error('Failed to save public key', e);
        }
    },

    getPublicKey: async (): Promise<string | null> => {
        try {
            return await AsyncStorage.getItem(KEYS.PUBLIC_KEY);
        } catch (e) {
            console.error('Failed to load public key', e);
            return null;
        }
    },

    saveTargetUrl: async (url: string): Promise<void> => {
        try {
            await AsyncStorage.setItem(KEYS.TARGET_URL, url);
        } catch (e) {
            console.error('Failed to save target url', e);
        }
    },

    getTargetUrl: async (): Promise<string | null> => {
        try {
            return await AsyncStorage.getItem(KEYS.TARGET_URL);
        } catch (e) {
            console.error('Failed to load target url', e);
            return null;
        }
    },
};
