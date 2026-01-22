import { SettingsManager } from '../../managers/SettingsManager';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
    setItem: jest.fn(),
    getItem: jest.fn(),
}));

describe('SettingsManager', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should save and get public key', async () => {
        const key = 'test-key';
        await SettingsManager.savePublicKey(key);
        expect(AsyncStorage.setItem).toHaveBeenCalledWith('privateai_public_key', key);

        (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(key);
        const retrieved = await SettingsManager.getPublicKey();
        expect(retrieved).toBe(key);
    });

    it('should save and get target url', async () => {
        const url = 'http://test.com';
        await SettingsManager.saveTargetUrl(url);
        expect(AsyncStorage.setItem).toHaveBeenCalledWith('privateai_target_url', url);

        (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(url);
        const retrieved = await SettingsManager.getTargetUrl();
        expect(retrieved).toBe(url);
    });

    it('should save and get auth secret', async () => {
        const secret = 'super-secret';
        await SettingsManager.saveAuthSecret(secret);
        expect(AsyncStorage.setItem).toHaveBeenCalledWith('privateai_auth_secret', secret);

        (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(secret);
        const retrieved = await SettingsManager.getAuthSecret();
        expect(retrieved).toBe(secret);
    });
});
