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

## GitHub Actions 주간 배포 (S3 + 선택적 CloudFront)

이 저장소에서 자동 배포에 사용하는 파일:

- 워크플로: `.github/workflows/deploy-s3-weekly.yml`

배포 흐름:

1. GitHub Actions 스케줄 실행
2. 프런트 빌드 (`pnpm build`)
3. S3 동기화
4. (선택) CloudFront 무효화

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
