import os
import json
import uuid
from google.cloud import storage
import functions_framework

# Configuration from Environment Variables
BUCKET_NAME = os.environ.get('BUCKET_NAME')
AUTH_SECRET = os.environ.get('AUTH_SECRET')

storage_client = storage.Client()

@functions_framework.http
def ingest(request):
    """
    HTTP Cloud Function to ingest encrypted data.
    """
    # 1. CORS Headers (Optional, useful if called from Web)
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Secret',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)

    headers = {
        'Access-Control-Allow-Origin': '*'
    }

    # 2. Authentication
    client_secret = request.headers.get('X-Auth-Secret')
    if not AUTH_SECRET or client_secret != AUTH_SECRET:
        return ('Unauthorized', 401, headers)

    # 3. Request Validation
    if request.method != 'POST':
        return ('Method not allowed', 405, headers)

    try:
        content_type = request.headers.get('content-type')
        if content_type == 'application/json':
            data = request.get_json(silent=True)
            # Use provided timestamp or current time
            payload_id = str(uuid.uuid4())
            filename = f"{payload_id}.json"
            content_type_upload = 'application/json'
            blob_data = json.dumps(data)
        else:
            return ('Unsupported Content-Type. Use application/json', 400, headers)
        
        if not BUCKET_NAME:
            return ('Server Error: BUCKET_NAME not configured', 500, headers)

        # 4. Upload to GCS
        bucket = storage_client.bucket(BUCKET_NAME)
        blob = bucket.blob(filename)
        blob.upload_from_string(blob_data, content_type=content_type_upload)

        print(f"Uploaded {filename} to {BUCKET_NAME}")

        return (json.dumps({'status': 'success', 'id': payload_id}), 200, headers)

    except Exception as e:
        print(f"Error: {e}")
        return (f"Internal Server Error: {str(e)}", 500, headers)
