# PrivateAI

A secure, private note-taking application that encrypts data (text and audio) on the device before uploading it to a private cloud endpoint.

## Features

- **Hybrid Encryption**: Uses AES-256-GCM for data and RSA-OAEP for key exchange. Everything is encrypted on the client.
- **Cross-Platform**: Built with React Native (Expo) for Android, iOS, and Web.
- **Serverless Backend**: Google Cloud Functions + Cloud Storage + Pub/Sub architecture.
- **Home Server Worker**: Python worker that automatically downloads and decrypts your notes.

## Architecture

1.  **App**: Encrypts input -> POST to Cloud Function.
2.  **Cloud Function**: Validates Auth -> Uploads to GCS Bucket.
3.  **GCS**: Stores file -> Triggers Pub/Sub.
4.  **Pub/Sub**: Queues event "New File".
5.  **Home Server**: Listens -> Downloads -> Decrypts -> Saves locally.

## Setup

### 1. App Development

```bash
# Install dependencies
npm install

# Run Tests
npm test
npm test:coverage

# Run App
npm start
```

### 2. Backend (GCP) Implementation

See `cloud/README.md` (or source) for deployment:

```bash
gcloud functions deploy ingest ...
```

### 3. Home Server

```bash
cd worker
pip install -r requirements.txt
python main.py
```

## Configuration

In the App, go to **Settings**:
1.  **GCP Endpoint URL**: The URL of your deployed Cloud Function.
2.  **Auth Secret**: A secret string shared between App and Cloud Function.
3.  **RSA Public Key**: Your Personal Public Key (PEM format).

## Security

- Private keys never leave your home server (or wherever you generate them).
- The Cloud only sees encrypted blobs.
- `Auth Secret` prevents unauthorized uploads (basic DoS protection).
