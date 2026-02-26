#!/bin/bash

# 사용: bash scripts/lib/upload-s3-images.sh <domain>
# 예시: bash scripts/lib/upload-s3-images.sh projects

DOMAIN=$1

if [ -z "$DOMAIN" ]; then
  echo "Error: Domain argument is required."
  echo "Usage: $0 <domain>"
  exit 1
fi

IMAGE_DIR="public/images/$DOMAIN"

if [ -z "$S3_BUCKET" ]; then
  echo "S3_BUCKET environment variable is not set. Skipping S3 upload for $DOMAIN."
  exit 0
fi

if [ -d "$IMAGE_DIR" ]; then
  echo "Uploading images for $DOMAIN to S3..."
  aws s3 sync "$IMAGE_DIR" "s3://$S3_BUCKET/images/$DOMAIN" --cache-control "public,max-age=31536000,immutable"
  echo "Upload complete for $DOMAIN."
else
  echo "Directory $IMAGE_DIR does not exist. Skipping S3 upload for $DOMAIN."
fi
