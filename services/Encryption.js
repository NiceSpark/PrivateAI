import forge from 'node-forge';


/**
 * Encrypts data using Hybrid Encryption (AES-GCM + RSA).
 * 
 * 1. Generates a random 32-byte AES Key and 12-byte IV.
 * 2. Encrypts the data using AES-256-GCM.
 * 3. Encrypts the AES Key using the provided RSA Public Key.
 * 
 * @param {string} data - The plain text data to encrypt.
 * @param {string} publicKeyPem - The RSA Public Key in PEM format.
 * @returns {Promise<{encryptedKey: string, iv: string, data: string}>} - Base64 encoded artifacts.
 */
export const hybridEncrypt = async (data, publicKeyPem) => {
    try {
        // 1. Generate AES Key (32 bytes) and IV (12 bytes)
        // We can use forge for random bytes or expo-crypto. Forge is synchronous for this usually.
        const keyBytes = forge.random.getBytesSync(32);
        const ivBytes = forge.random.getBytesSync(12);

        // 2. Encrypt Data with AES-GCM
        const cipher = forge.cipher.createCipher('AES-GCM', keyBytes);
        cipher.start({ iv: ivBytes });
        cipher.update(forge.util.createBuffer(data, 'utf8'));
        cipher.finish();
        const encryptedData = cipher.output.getBytes();
        const tag = cipher.mode.tag.getBytes();

        // Combine encrypted data and auth tag for storage/transport if needed, 
        // but usually GCM tag is separate or appended. 
        // Let's append tag to data for simplicity: data + tag.
        const finalData = encryptedData + tag;

        // 3. Encrypt AES Key with RSA Public Key
        const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
        const encryptedKey = publicKey.encrypt(keyBytes, 'RSA-OAEP', {
            md: forge.md.sha256.create(),
        });

        // 4. Return Base64 encoded strings
        return {
            encryptedKey: forge.util.encode64(encryptedKey),
            iv: forge.util.encode64(ivBytes),
            data: forge.util.encode64(finalData),
        };
    } catch (error) {
        console.error('Encryption failed:', error);
        throw error;
    }
};
