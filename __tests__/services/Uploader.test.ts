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

    it('should upload audio reading file via fetch', async () => {
        // Mock fetch for the file read (first call) AND the upload (second call)
        (global.fetch as jest.Mock)
            .mockResolvedValueOnce({
                blob: async () => ({
                    // Mock blob implementation if needed by FileReader, 
                    // but since FileReader is valid in JSDOM/Node environment with polyfills?
                    // Jest environment usually doesn't have FileReader or Blob fully working without setup.
                    // We might need to mock FileReader.
                })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ status: 'success' }),
            });

        // Mock FileReader
        const mockFileReader = {
            readAsDataURL: jest.fn(),
            result: 'data:audio/m4a;base64,audio-base64-content',
            onloadend: null as any,
            onerror: null as any,
        };

        // Use spyOn or just plain overwrite for the test scope if possible, 
        // but global.FileReader is a constructor.
        global.FileReader = jest.fn(() => mockFileReader) as any;

        // Trigger the onloadend manually when readAsDataURL is called
        mockFileReader.readAsDataURL.mockImplementation(() => {
            if (mockFileReader.onloadend) mockFileReader.onloadend();
        });

        await Uploader.uploadAudio('file://audio.m4a');

        expect(global.fetch).toHaveBeenCalledTimes(2); // 1. read file, 2. upload
        expect(global.fetch).toHaveBeenLastCalledWith('http://api.com', expect.objectContaining({
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
