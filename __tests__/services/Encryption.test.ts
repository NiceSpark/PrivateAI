import { hybridEncrypt } from '../../services/Encryption';
import forge from 'node-forge';

describe('Encryption Service', () => {
    // Generate a real key pair for testing
    const keypair = forge.pki.rsa.generateKeyPair({ bits: 2048 });
    const publicKeyPem = forge.pki.publicKeyToPem(keypair.publicKey);

    it('should encrypt a text payload correctly', async () => {
        const text = "Hello World";
        const result = await hybridEncrypt(text, publicKeyPem);

        expect(result).toHaveProperty('encryptedKey');
        expect(result).toHaveProperty('iv');
        expect(result).toHaveProperty('data');

        // Verify we can decrypt it back (proving encryption logic holds)
        // 1. Decode generic fields
        const encryptedKey = forge.util.decode64(result.encryptedKey);
        const iv = forge.util.decode64(result.iv);
        const encryptedData = forge.util.decode64(result.data);

        // 2. Decrypt AES Key with Private Key
        const decryptedKey = keypair.privateKey.decrypt(encryptedKey, 'RSA-OAEP', {
            md: forge.md.sha256.create(),
        });

        // 3. Decrypt Data with AES-GCM
        const decipher = forge.cipher.createDecipher('AES-GCM', decryptedKey);
        decipher.start({ iv: iv, tag: forge.util.createBuffer(encryptedData.slice(-16)) });
        decipher.update(forge.util.createBuffer(encryptedData.slice(0, -16)));
        const success = decipher.finish();

        expect(success).toBe(true);
        expect(decipher.output.toString()).toBe(text);
    });

    it('should throw error for invalid public key', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        const text = "Fail";
        const invalidKey = "Not a key";
        await expect(hybridEncrypt(text, invalidKey)).rejects.toThrow();
        consoleSpy.mockRestore();
    });
});
