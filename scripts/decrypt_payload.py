import sys
import json
import base64
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

def decrypt_payload(payload_path, private_key_path):
    # 1. Load Private Key
    with open(private_key_path, "rb") as key_file:
        private_key = serialization.load_pem_private_key(
            key_file.read(),
            password=None
        )

    # 2. Load Payload
    with open(payload_path, "r") as f:
        data = json.load(f)

    payload = data.get("payload", data) # Handle if wrapped
    
    enc_key_b64 = payload["encryptedKey"]
    iv_b64 = payload["iv"]
    data_b64 = payload["data"]

    enc_key = base64.b64decode(enc_key_b64)
    iv = base64.b64decode(iv_b64)
    ciphertext_with_tag = base64.b64decode(data_b64)

    # separate tag (last 16 bytes for GCM usually, but node-forge might behave differently. 
    # In Encryption.js we appended tag: const finalData = encryptedData + tag;
    # Tag length for GCM is usually 16 bytes (128 bits).
    tag = ciphertext_with_tag[-16:]
    ciphertext = ciphertext_with_tag[:-16]

    # 3. Decrypt AES Key
    aes_key = private_key.decrypt(
        enc_key,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None
        )
    )

    # 4. Decrypt Data
    cipher = Cipher(algorithms.AES(aes_key), modes.GCM(iv, tag))
    decryptor = cipher.decryptor()
    decrypted_data = decryptor.update(ciphertext) + decryptor.finalize()

    return decrypted_data

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python decrypt_payload.py <payload.json> <private_key.pem> [output_file]")
        sys.exit(1)

    payload_file = sys.argv[1]
    key_file = sys.argv[2]
    out_file = sys.argv[3] if len(sys.argv) > 3 else None

    try:
        result = decrypt_payload(payload_file, key_file)
        
        # Check if audio or text based on json usually, but here we just have bytes.
        # We can try to decode as utf-8, if fails, it's binary.
        try:
            text = result.decode('utf-8')
            print("Decrypted Text:")
            print(text)
            if out_file:
                 with open(out_file, "w") as f:
                     f.write(text)
                     print(f"Saved to {out_file}")
        except UnicodeDecodeError:
            print("Decrypted Binary Data (likely Audio)")
            if out_file:
                with open(out_file, "wb") as f:
                    f.write(result)
                print(f"Saved to {out_file}")
            else:
                print("Provide output filename to save binary data.")

    except Exception as e:
        print(f"Decryption failed: {e}")
