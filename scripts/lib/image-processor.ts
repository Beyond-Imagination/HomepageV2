import { spawnSync } from 'node:child_process'
import { existsSync, unlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, extname, join } from 'node:path'

const IMAGICK_COMMANDS = ['magick', 'convert'] as const

export type CommandResult = { error?: Error; status: number | null }
export type CommandRunner = (command: string, args: string[]) => CommandResult

const defaultRunner: CommandRunner = (command, args) => {
  try {
    const result = spawnSync(command, args, { stdio: 'ignore' })
    return { error: result.error, status: result.status }
  } catch (error) {
    return {
      error: error instanceof Error ? error : new Error(String(error)),
      status: null,
    }
  }
}

/**
 * HEIC/HEIF 확장자 여부 판별.
 */
export function isHeicFile(filePath: string): boolean {
  return /\.(heic|heif)$/i.test(filePath)
}

/**
 * HEIC 입력을 임시 JPEG로 사전 변환한다.
 * 기본 ImageMagick 빌드/정책에서 HEIC 디코더가 비활성일 수 있으므로
 * heif-convert(libheif) → sips(macOS) → magick `heic:` prefix 순으로 폴백한다.
 * 생성된 임시 파일 경로를 반환하고, 모두 실패하면 null.
 */
function preConvertHeic(heicPath: string, runner: CommandRunner): string | null {
  const tempPath = join(
    tmpdir(),
    `imagick-heic-${process.pid}-${Date.now()}-${basename(heicPath, extname(heicPath))}.jpg`
  )

  const attempts: Array<{ command: string; args: string[] }> = [
    { command: 'heif-convert', args: [heicPath, tempPath] },
    { command: 'sips', args: ['-s', 'format', 'jpeg', heicPath, '--out', tempPath] },
    ...IMAGICK_COMMANDS.map((command) => ({
      command,
      args: [`heic:${heicPath}`, tempPath],
    })),
  ]

  for (const { command, args } of attempts) {
    const result = runner(command, args)
    if (!result.error && result.status === 0 && existsSync(tempPath)) {
      return tempPath
    }
  }

  return null
}

/**
 * ImageMagick CLI (magick -> convert) fallback 실행.
 * 첫 번째로 성공하는 명령어의 결과를 반환한다.
 *
 * 입력이 HEIC/HEIF인 경우, 기본 디코더가 막혀 있을 수 있어
 * 임시 JPEG로 사전 변환한 뒤 나머지 인자와 조합해 실행한다.
 * runner 인자는 테스트용 DI 포인트로, 기본값은 실제 spawnSync 호출.
 */
export function runImageMagick(args: string[], runner: CommandRunner = defaultRunner): boolean {
  let tempConverted: string | null = null
  let finalArgs = args

  if (args.length > 0 && isHeicFile(args[0])) {
    tempConverted = preConvertHeic(args[0], runner)
    if (tempConverted) {
      finalArgs = [tempConverted, ...args.slice(1)]
    }
  }

  try {
    for (const command of IMAGICK_COMMANDS) {
      const result = runner(command, finalArgs)
      if (!result.error && result.status === 0) {
        return true
      }
    }
    return false
  } finally {
    if (tempConverted && existsSync(tempConverted)) {
      try {
        unlinkSync(tempConverted)
      } catch {
        // best-effort cleanup
      }
    }
  }
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
