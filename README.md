# Beyond Imagination

## 개발 환경 설정

### 필수 의존성 설치

#### ImageMagick

썸네일 생성을 위해 ImageMagick이 필요합니다. `sync:gallery` 스크립트를 로컬에서 실행하려면 먼저 설치해야 합니다.

**macOS (Homebrew):**

```bash
brew install imagemagick
```

**Ubuntu/Debian:**

```bash
sudo apt-get update
sudo apt-get install imagemagick
```

**Windows:**

- [ImageMagick 공식 다운로드 페이지](https://imagemagick.org/script/download.php)에서 설치 프로그램 다운로드
- 설치 시 "Install legacy utilities (e.g. convert)" 옵션 체크

설치 확인:

```bash
magick --version
# 또는
convert --version
```

### 코드 포맷팅 및 린팅

이 프로젝트는 코드 품질을 유지하기 위해 다음 도구들을 사용합니다:

- **Prettier**: 코드 포맷팅
- **ESLint**: 코드 린팅
- **Husky**: Git hooks 관리
- **lint-staged**: 스테이징된 파일에만 린트/포맷 적용

### 사용 가능한 스크립트

```bash
# 개발 서버 실행
pnpm dev

# 린트 검사
pnpm lint

# 린트 자동 수정
pnpm lint:fix

# 코드 포맷팅
pnpm format

# 포맷 검사 (수정 없이)
pnpm format:check

# 빌드
pnpm build
```

### 문의 폼 Discord 웹훅 설정

문의 폼 전송을 활성화하려면 프런트 환경변수에 Discord 웹훅 URL을 설정하세요.

- `VITE_DISCORD_CONTACT_WEBHOOK_URL`

### Git Commit 시 자동 실행

커밋할 때마다 자동으로 다음 작업이 실행됩니다:

1. **Prettier**: 스테이징된 파일 포맷팅
2. **ESLint**: 스테이징된 파일 린트 및 자동 수정

포맷팅이나 린트 오류가 있으면 커밋이 중단되므로, 수정 후 다시 커밋하세요.

### 로컬 ESLint 사용하기

전역 ESLint와 충돌을 방지하기 위해 항상 pnpm을 통해 실행하세요:

```bash
# ❌ 직접 실행하지 마세요
eslint . --fix

# ✅ pnpm을 통해 실행하세요
pnpm lint:fix
```

## GitHub Actions 주간 배포 (S3 + 선택적 CloudFront)

이 저장소에서 자동 배포에 사용하는 파일:

- 워크플로: `.github/workflows/deploy-s3-weekly.yml`

배포 흐름:

1. GitHub Actions 스케줄 실행
2. Notion 갤러리 동기화 + 썸네일 생성 (`pnpm sync:gallery`)
3. S3 이미지 업로드
4. Notion `S3 link` 반영 (`pnpm sync:gallery:apply-links`)
5. 프런트 빌드 (`pnpm build`)
6. 정적 파일/HTML 배포
7. (선택) CloudFront 무효화

### 스케줄

워크플로는 아래 스케줄로 설정되어 있습니다.

- 한국시간 매주 월요일 00:00 (KST)
- GitHub cron(UTC): `0 15 * * 0`

참고: GitHub Actions cron은 UTC 기준입니다.

### GitHub Secrets 설정

리포지토리 `Settings > Secrets and variables > Actions`에 아래 시크릿을 추가하세요.

필수:

- `AWS_ROLE_TO_ASSUME` (GitHub OIDC로 Assume할 IAM Role ARN)
- `AWS_REGION`
- `S3_BUCKET`
- `NOTION_TOKEN`
- `NOTION_GALLERY_DATABASE_ID`
- `DISCORD_WEBHOOK_URL` (배포 완료 시 결과/소요시간 요약 알림용)
- `VITE_DISCORD_CONTACT_WEBHOOK_URL` (문의 폼 Discord 전송용, 프런트 번들에 포함됨)

선택:

- `CLOUDFRONT_DISTRIBUTION_ID`

### AWS IAM 권한

#### 1) GitHub OIDC 신뢰 정책이 있는 IAM Role 생성

`AWS_ROLE_TO_ASSUME`로 사용할 Role에 GitHub OIDC 신뢰 정책을 연결해야 합니다.

#### 2) 해당 Role 권한 정책

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3Deploy",
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::YOUR_S3_BUCKET"
    },
    {
      "Sid": "S3ObjectsDeploy",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:DeleteObject", "s3:GetObject"],
      "Resource": "arn:aws:s3:::YOUR_S3_BUCKET/*"
    },
    {
      "Sid": "CloudFrontInvalidate",
      "Effect": "Allow",
      "Action": ["cloudfront:CreateInvalidation"],
      "Resource": "*"
    }
  ]
}
```

### 수동 배포

워크플로에는 `workflow_dispatch`가 포함되어 있어, GitHub Actions 탭에서 수동 실행도 가능합니다.

### 참고

- HTML은 no-cache, 나머지 정적 파일은 장기 캐시로 업로드합니다.
- Notion DB는 페이지네이션으로 전체 페이지를 모두 조회합니다(제한 없음).
- `S3 link` 속성에는 원본 경로(`/images/gallery/original/...`)를 저장해 사용합니다.
- `S3 link`가 비어있으면 Notion 이미지를 내려받아 배포 대상에 포함하고, `S3 link`에 상대 경로를 기록합니다.
- 썸네일은 `/images/gallery/thumb/...` 경로로 생성되며, 목록에서는 썸네일을 사용하고 클릭 시 원본을 불러옵니다.
- 기존 `images/gallery` 경로의 파일은 배포 시 `--delete` 대상에서 제외해 유지됩니다.
- 워크플로 종료 시 Discord 웹훅으로 배포 결과(성공/실패), 실패 단계, 총 소요 시간을 1회 요약 전송합니다.
- **병렬 처리**: `p-limit` 라이브러리를 사용하여 최대 5개의 이미지를 동시에 처리합니다. Notion API의 rate limit를 고려하여 동시 처리 수를 제한하였으며, `CONCURRENT_LIMIT` 상수로 조정할 수 있습니다.
- **Notion API 재시도**: 최대 3회 재시도합니다. `429`는 `Retry-After` 헤더 값을 우선 사용하고(없거나 파싱 실패 시 0.5초 fallback), `5xx`/네트워크 오류는 0.5초 대기 후 재시도합니다.
- **정합성 보장**: Notion `S3 link` 업데이트는 S3 업로드가 성공한 뒤에만 실행되므로, 링크만 먼저 반영되는 불일치를 방지합니다.
