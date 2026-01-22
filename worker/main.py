import os
import json
import time
import base64
from concurrent.futures import TimeoutError
from google.cloud import pubsub_v1
from google.cloud import storage
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

# Configuration
PROJECT_ID = os.environ.get('GOOGLE_CLOUD_PROJECT', 'privateai-485112') # Default from user input
SUBSCRIPTION_ID = 'home-server-sub'
PRIVATE_KEY_PATH = '../secrets/private_key.pem' 

# Initialize Clients
subscriber = pubsub_v1.SubscriberClient()
storage_client = storage.Client()
subscription_path = subscriber.subscription_path(PROJECT_ID, SUBSCRIPTION_ID)

def load_private_key(path):
    with open(path, "rb") as key_file:
        return serialization.load_pem_private_key(
            key_file.read(),
            password=None,
        )

def decrypt_data(encrypted_payload, private_key):
    try:
        # 1. Parse JSON
        payload = json.loads(encrypted_payload)
        enc_key_b64 = payload['encryptedKey']
        iv_b64 = payload['iv']
        data_b64 = payload['data']

        # 2. Decode Base64
        encrypted_aes_key = base64.b64decode(enc_key_b64)
        iv = base64.b64decode(iv_b64)
        encrypted_data_with_tag = base64.b64decode(data_b64)

        # 3. Decrypt AES Key with RSA
        aes_key = private_key.decrypt(
            encrypted_aes_key,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )

        # 4. Decrypt Data with AES-GCM
        # Split tag from data (tag is usually last 16 bytes for GCM in many implementations, 
        # but node-forge 'finish()' + 'bytes' + 'tag' concatenation means tag is at the end)
        tag = encrypted_data_with_tag[-16:]
        ciphertext = encrypted_data_with_tag[:-16]

        cipher = Cipher(algorithms.AES(aes_key), modes.GCM(iv, tag))
        decryptor = cipher.decryptor()
        decrypted_bytes = decryptor.update(ciphertext) + decryptor.finalize()
        
        return decrypted_bytes

    except Exception as e:
        print(f"Decryption Error: {e}")
        return None

def callback(message):
    try:
        # GCS Notification Payload is in the data field as JSON
        data = message.data.decode("utf-8")
        attributes = json.loads(data)
        
        bucket_id = attributes.get('bucket')
        object_id = attributes.get('name')
        
        if not bucket_id or not object_id:
            print("Invalid message format, missing bucket or name")
            message.ack()
            return

        print(f"Processing file: gs://{bucket_id}/{object_id}")

        # Download from GCS
        bucket = storage_client.bucket(bucket_id)
        blob = bucket.blob(object_id)
        content = blob.download_as_text()

        # Parse the App's JSON Wrapper
        try:
            file_json = json.loads(content)
            inner_payload = file_json.get('payload')
            note_type = file_json.get('type')
            
            if not inner_payload or not note_type:
                print("Error: content is missing 'payload' or 'type' fields")
                message.ack()
                return
                
        except json.JSONDecodeError:
            print("Error: content is not valid JSON")
            message.ack()
            return

        # Decrypt
        private_key = load_private_key(PRIVATE_KEY_PATH)
        decrypted_bytes = decrypt_data(json.dumps(inner_payload), private_key)

        # create output directory if it doesn't exist
        if not os.path.exists('output'):
            os.makedirs('output')

        if decrypted_bytes:
            print(f"--- NEW {note_type.upper()} NOTE ---")
            if note_type == 'text':
                    print(f"Content: {decrypted_bytes.decode('utf-8')}")
                    # save to file
                    filename = f"output/received_text_{int(time.time())}.txt"
                    with open(filename, "wb") as f:
                        f.write(decrypted_bytes)
                    print(f"Saved text to {filename}")
            elif note_type == 'audio':
                    # Audio is base64 encoded inside the encrypted data
                    audio_b64 = decrypted_bytes.decode('utf-8')
                    audio_bytes = base64.b64decode(audio_b64)
                    filename = f"output/received_audio_{int(time.time())}.m4a"
                    with open(filename, "wb") as f:
                        f.write(audio_bytes)
                    print(f"Saved audio to {filename}")

        message.ack()
        print("Message acknowledged.")

    except Exception as e:
        print(f"Error processing message: {e}")
        # Optionally nack() to retry, but for now ack to avoid loops
        message.ack()

if __name__ == '__main__':
    print(f"Listening for messages on {subscription_path}...")
    
    # Ensure private key exists
    if not os.path.exists(PRIVATE_KEY_PATH):
       print(f"ERROR: Private key not found at {PRIVATE_KEY_PATH}")
       exit(1)

    streaming_pull_future = subscriber.subscribe(subscription_path, callback=callback)
    with subscriber:
        try:
            streaming_pull_future.result()
        except TimeoutError:
            streaming_pull_future.cancel()
            streaming_pull_future.result()
