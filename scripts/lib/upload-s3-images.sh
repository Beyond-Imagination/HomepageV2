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

# 이 아래는 만약 ci,cd 환경이 변경될 경우 수정이 필요한 부분입니다.
# 로컬 환경에서의 테스트를 위해서 어쩔 수 없이 bypass하는 로직을 추가했습니다.
if [ -z "$S3_BUCKET" ]; then
  if [ "$GITHUB_ACTIONS" = "true" ]; then
    echo "Error: S3_BUCKET environment variable is required in GitHub Actions environment." >&2
    echo "::error title=Missing Environment Variable::S3_BUCKET environment variable is not set."
    exit 1
  fi
  echo "S3_BUCKET environment variable is not set. Skipping S3 upload for local testing."
  exit 0
fi

if [ ! -d "$IMAGE_DIR" ]; then
  echo "Directory $IMAGE_DIR does not exist. Creating it."
  mkdir -p "$IMAGE_DIR"
fi

echo "Uploading images for $DOMAIN to S3..."
if aws s3 sync "$IMAGE_DIR" "s3://$S3_BUCKET/images/$DOMAIN" --cache-control "public,max-age=31536000,immutable"; then
  echo "Upload complete for $DOMAIN."
else
  echo "Error: S3 upload failed for $DOMAIN." >&2
  echo "::Error title=S3 Upload Failed::Failed to sync images for domain: $DOMAIN."
  exit 1
fi
