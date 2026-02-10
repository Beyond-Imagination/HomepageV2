# Beyond Imagination

## 개발 환경 설정

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

## AWS 크론 배포 (EventBridge + Lambda + CodeBuild + S3)

이 저장소에는 아래 파일이 추가되어 있습니다.

- Lambda 핸들러: `aws/lambda/deploy-trigger/index.mjs`
- Lambda 의존성: `aws/lambda/deploy-trigger/package.json`
- S3 배포용 CodeBuild 스펙: `buildspec.s3-deploy.yml`

권장 아키텍처:

1. EventBridge 스케줄(크론) 실행
2. Lambda가 CodeBuild `StartBuild` 호출
3. CodeBuild가 `pnpm build` 후 S3 동기화
4. (선택) CloudFront 캐시 무효화

### 1) 직접 채워야 하는 값 (계정정보/URL)

아래 값들은 AWS 콘솔에서 확인 후 그대로 넣으세요.

- `AWS_ACCOUNT_ID`: 예) `123456789012`
- `AWS_REGION`: 예) `ap-northeast-2`
- `S3_BUCKET`: 정적 사이트 버킷 이름
- `CLOUDFRONT_DISTRIBUTION_ID`: 예) `E123ABC456XYZ` (없으면 비워도 됨)
- `SITE_URL`: 배포 사이트 URL (CloudFront 도메인 또는 커스텀 도메인)
- `CODEBUILD_PROJECT_NAME`: 예) `homepagev2-s3-deploy`
- `CODEBUILD_SOURCE_VERSION`: 예) `main` (배포 브랜치)
- `EVENTBRIDGE_CRON`: 예) `cron(0 0 * * ? *)` (UTC 기준 매일 00:00)
- `EVENTBRIDGE_TIMEZONE`: 예) `Asia/Seoul` (Scheduler 사용 시)

### 2) Lambda 환경변수 설정

Lambda 함수에 아래 환경변수를 설정하세요.

- `CODEBUILD_PROJECT_NAME` (필수)
- `CODEBUILD_SOURCE_VERSION` (선택, 기본 브랜치 지정용)
- `CODEBUILD_ENV_OVERRIDES_JSON` (선택)

`CODEBUILD_ENV_OVERRIDES_JSON` 예시:

```json
[
  { "name": "S3_BUCKET", "value": "YOUR_S3_BUCKET", "type": "PLAINTEXT" },
  {
    "name": "CLOUDFRONT_DISTRIBUTION_ID",
    "value": "YOUR_DISTRIBUTION_ID",
    "type": "PLAINTEXT"
  }
]
```

### 3) Lambda 실행 역할(IAM) 권한

Lambda 실행 역할에는 최소 아래 권한이 필요합니다.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CodeBuildStart",
      "Effect": "Allow",
      "Action": ["codebuild:StartBuild"],
      "Resource": "arn:aws:codebuild:AWS_REGION:AWS_ACCOUNT_ID:project/CODEBUILD_PROJECT_NAME"
    },
    {
      "Sid": "CloudWatchLogs",
      "Effect": "Allow",
      "Action": ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
      "Resource": "*"
    }
  ]
}
```

### 4) CodeBuild 프로젝트 설정

CodeBuild 프로젝트 생성 시:

1. 소스: GitHub 연결(또는 CodeCommit 등)
2. Buildspec 경로: `buildspec.s3-deploy.yml`
3. 환경변수:
   - `S3_BUCKET` (필수)
   - `CLOUDFRONT_DISTRIBUTION_ID` (선택)
4. 런타임: Node.js 20 이상

CodeBuild 서비스 역할에는 최소 아래 권한이 필요합니다.

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

### 5) EventBridge 크론 설정

EventBridge Scheduler 또는 EventBridge Rule에서 Lambda를 타겟으로 연결하세요.

- 매일 한국시간 오전 9시 배포 예시 (Scheduler + Timezone 사용):
  - 스케줄: `cron(0 9 * * ? *)`
  - Timezone: `Asia/Seoul`
- Rule(cron)만 사용할 경우 UTC로 계산해서 입력하세요.

필요하면 EventBridge에서 Lambda로 전달할 payload 예시:

```json
{
  "sourceVersion": "main",
  "environmentOverrides": [{ "name": "S3_BUCKET", "value": "YOUR_S3_BUCKET", "type": "PLAINTEXT" }]
}
```

### 6) Lambda 로컬 테스트 이벤트 예시

```json
{
  "sourceVersion": "main",
  "environmentOverrides": [
    { "name": "S3_BUCKET", "value": "YOUR_S3_BUCKET", "type": "PLAINTEXT" },
    {
      "name": "CLOUDFRONT_DISTRIBUTION_ID",
      "value": "YOUR_DISTRIBUTION_ID",
      "type": "PLAINTEXT"
    }
  ]
}
```

### 7) 참고

- Lambda 코드는 빌드를 직접 수행하지 않고 CodeBuild를 호출합니다.
- 실제 S3 배포 로직은 `buildspec.s3-deploy.yml`에 있습니다.
- HTML은 no-cache, 나머지 정적 파일은 장기 캐시로 업로드합니다.
