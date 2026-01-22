import { Uploader } from '../../services/Uploader';
import { SettingsManager } from '../../managers/SettingsManager';
import * as FileSystem from 'expo-file-system';

// Mocks
jest.mock('../../managers/SettingsManager');
jest.mock('expo-file-system');
jest.mock('../../services/Encryption', () => ({
    hybridEncrypt: jest.fn().mockResolvedValue({
        encryptedKey: 'key',
        iv: 'iv',
        data: 'data',
    }),
}));

global.fetch = jest.fn() as any;

describe('Uploader', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (SettingsManager.getPublicKey as jest.Mock).mockResolvedValue('pubkey');
        (SettingsManager.getTargetUrl as jest.Mock).mockResolvedValue('http://api.com');
        (SettingsManager.getAuthSecret as jest.Mock).mockResolvedValue('secret');
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ status: 'success' }),
        });
    });

    it('should upload text with correct headers and body', async () => {
        await Uploader.uploadText('hello');

        expect(global.fetch).toHaveBeenCalledWith('http://api.com', expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
                'Content-Type': 'application/json',
                'X-Auth-Secret': 'secret',
            }),
            body: expect.stringContaining('"type":"text"'),
        }));
    });

    it('should upload audio reading file as base64', async () => {
        (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue('audio-base64');

        await Uploader.uploadAudio('file://audio.m4a');

        expect(FileSystem.readAsStringAsync).toHaveBeenCalledWith('file://audio.m4a', { encoding: 'base64' });
        expect(global.fetch).toHaveBeenCalledWith('http://api.com', expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('"type":"audio"'),
        }));
    });

    it('should throw error is config missing', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        (SettingsManager.getPublicKey as jest.Mock).mockResolvedValue(null);
        await expect(Uploader.uploadText('fail')).rejects.toThrow('Missing configuration');
        consoleSpy.mockRestore();
    });
});
