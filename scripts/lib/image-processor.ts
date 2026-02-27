import { spawnSync } from 'node:child_process'

const IMAGICK_COMMANDS = ['magick', 'convert'] as const

/**
 * ImageMagick CLI (magick -> convert) fallback 실행.
 * 첫 번째로 성공하는 명령어의 결과를 반환한다.
 */
function runImageMagick(args: string[]): boolean {
  for (const command of IMAGICK_COMMANDS) {
    const result = spawnSync(command, args, { stdio: 'ignore' })
    if (!result.error && result.status === 0) {
      return true
    }
  }
  return false
}

/**
 * 비율을 유지하면서 지정 width 이하로 축소한 썸네일을 생성한다.
 * ImageMagick `-resize {W}>` 사용 (원본이 작으면 확대하지 않음).
 */
export function createThumbnail(
  originalPath: string,
  thumbPath: string,
  options: { width?: number; quality?: number } = {}
): boolean {
  const { width = 640, quality = 72 } = options
  return runImageMagick([
    originalPath,
    '-auto-orient',
    '-resize',
    `${width}>`,
    '-quality',
    String(quality),
    thumbPath,
  ])
}

/**
 * 정사각형으로 center crop + 리사이즈한 이미지를 생성한다.
 */
export function resizeAndCrop(
  originalPath: string,
  outputPath: string,
  options: { size?: number; quality?: number } = {}
): boolean {
  const { size = 512, quality = 80 } = options
  return runImageMagick([
    originalPath,
    '-auto-orient',
    '-resize',
    `${size}x${size}^`,
    '-gravity',
    'center',
    '-extent',
    `${size}x${size}`,
    '-quality',
    String(quality),
    outputPath,
  ])
}

/**
 * 목적: 스크린샷의 크기가 벗어날 경우 잘려서 보이는 것을 방지하기 위함
 * 원본 이미지의 품질을 유지하면서 명시된 최대 너비를 초과하는 경우에만 줄인다.
 * -quality 100 으로 압축 손실 방지
 */
export function optimizeOriginalImage(
  originalPath: string,
  outputPath: string,
  options: { maxWidth?: number; quality?: number } = {}
): boolean {
  const { maxWidth = 1920, quality = 100 } = options
  return runImageMagick([
    originalPath,
    '-auto-orient',
    '-resize',
    `${maxWidth}>`,
    '-quality',
    String(quality),
    outputPath,
  ])
}
