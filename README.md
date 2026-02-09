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
