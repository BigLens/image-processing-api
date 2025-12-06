#!/bin/bash

BASE_URL="http://localhost:3000"
TEST_IMG="test_assets/test.png"

echo "--- Starting API Test ---"

# 0. Dependencies
if ! command -v curl &> /dev/null; then
    echo "Error: curl is required"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo "Warning: jq not found. Output will not be pretty-printed."
fi

# 1. Prepare Image
mkdir -p test_assets
if [ ! -f "$TEST_IMG" ]; then
    echo "Downloading test image..."
    curl -s -o "$TEST_IMG" https://placehold.co/600x400.png
fi

# 2. Upload
echo "1. Uploading image..."
# Use -s for silent mode but show errors
UPLOAD_RES=$(curl -s -X POST -F "file=@$TEST_IMG" "$BASE_URL/upload")
echo "Response: $UPLOAD_RES"

# Extract ID (simple grep/sed fallback if no jq)
if command -v jq &> /dev/null; then
    ID=$(echo $UPLOAD_RES | jq -r '.id')
else
    ID=$(echo $UPLOAD_RES | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
fi

if [ -z "$ID" ] || [ "$ID" == "null" ]; then
    echo "Error: Failed to get Upload ID"
    exit 1
fi
echo "   ID: $ID"

# 3. Poll Status
echo "2. Polling status..."
STATUS="pending"
ATTEMPTS=0
MAX_ATTEMPTS=20

while [[ "$STATUS" == "pending" || "$STATUS" == "processing" || "$STATUS" == "PENDING" ]] && [[ $ATTEMPTS -lt $MAX_ATTEMPTS ]]; do
    sleep 1
    STATUS_RES=$(curl -s "$BASE_URL/upload/$ID/status")
    
    if command -v jq &> /dev/null; then
        STATUS=$(echo $STATUS_RES | jq -r '.status')
    else
        STATUS=$(echo $STATUS_RES | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    fi
    
    echo "   Attempt $((ATTEMPTS+1)): $STATUS"
    ATTEMPTS=$((ATTEMPTS+1))
done

if [[ "$STATUS" != "completed" && "$STATUS" != "COMPLETED" ]]; then
    echo "Error: Processing failed or timed out. Final status: $STATUS"
    exit 1
fi

# 4. Result
echo "3. Verifying result..."
RESULT_RES=$(curl -s "$BASE_URL/upload/$ID/result")
echo "Result: $RESULT_RES"

echo "--- Test Completed Successfully ---"
