import { describe, test, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  isHeicFile,
  runImageMagick,
  type CommandResult,
  type CommandRunner,
} from '../image-processor.ts'

type Call = { command: string; args: string[] }

function makeRecorder(respond: (command: string, args: string[], calls: Call[]) => CommandResult) {
  const calls: Call[] = []
  const runner: CommandRunner = (command, args) => {
    calls.push({ command, args: [...args] })
    return respond(command, args, calls)
  }
  return { calls, runner }
}

describe('isHeicFile', () => {
  test('.heic (lowercase) 는 true', () => {
    assert.equal(isHeicFile('photo.heic'), true)
  })

  test('.HEIC (uppercase) 도 true (대소문자 무시)', () => {
    assert.equal(isHeicFile('photo.HEIC'), true)
  })

  test('.heif 도 HEIF 계열로 true', () => {
    assert.equal(isHeicFile('photo.heif'), true)
  })

  test('.jpg / .png / .webp 는 false', () => {
    assert.equal(isHeicFile('photo.jpg'), false)
    assert.equal(isHeicFile('photo.png'), false)
    assert.equal(isHeicFile('photo.webp'), false)
  })

  test('경로 포함 파일도 확장자만 본다', () => {
    assert.equal(isHeicFile('/var/tmp/some dir/abc.heic'), true)
    assert.equal(isHeicFile('/var/tmp/some dir/abc.jpg'), false)
  })

  test('확장자 없거나 빈 문자열은 false', () => {
    assert.equal(isHeicFile(''), false)
    assert.equal(isHeicFile('noextension'), false)
  })
})

describe('runImageMagick (non-HEIC)', () => {
  test('HEIC 아닌 입력은 기존처럼 magick 을 1회 호출해 성공 시 true', () => {
    const { calls, runner } = makeRecorder(() => ({ status: 0 }))

    const ok = runImageMagick(['/in.jpg', '-resize', '500', '/out.jpg'], runner)

    assert.equal(ok, true)
    assert.equal(calls.length, 1, 'magick 1회 호출로 끝나야 함 (fallback 불필요)')
    assert.equal(calls[0].command, 'magick')
    assert.deepEqual(calls[0].args, ['/in.jpg', '-resize', '500', '/out.jpg'])
  })

  test('magick 이 실패하면 convert 로 폴백한다', () => {
    const { calls, runner } = makeRecorder((command) =>
      command === 'magick' ? { status: 1 } : { status: 0 }
    )

    const ok = runImageMagick(['/in.jpg', '/out.jpg'], runner)

    assert.equal(ok, true)
    assert.deepEqual(
      calls.map((c) => c.command),
      ['magick', 'convert']
    )
  })

  test('두 명령이 모두 실패하면 false', () => {
    const { runner } = makeRecorder(() => ({ status: 1 }))
    assert.equal(runImageMagick(['/in.jpg', '/out.jpg'], runner), false)
  })

  test('spawn error (명령어 없음) 도 실패로 취급한다', () => {
    const { runner } = makeRecorder(() => ({
      error: new Error('ENOENT'),
      status: null,
    }))
    assert.equal(runImageMagick(['/in.jpg', '/out.jpg'], runner), false)
  })
})

describe('runImageMagick (HEIC pre-conversion)', () => {
  // 실제로 존재하는 HEIC 경로를 넘겨야 preConvertHeic 가 existsSync 검사를 통과할 수 있음
  // (runner mock 이 tempPath 에 파일을 써 준 뒤, 그 path 가 실제로 존재해야 성공 판정)
  const fixtures: string[] = []

  function makeFakeHeic(label: string) {
    const path = join(tmpdir(), `heic-test-${process.pid}-${Date.now()}-${label}.heic`)
    writeFileSync(path, 'fake-heic-bytes')
    fixtures.push(path)
    return path
  }

  beforeEach(() => {
    fixtures.length = 0
  })

  afterEach(() => {
    for (const p of fixtures) rmSync(p, { force: true })
  })

  test('HEIC 입력은 heif-convert 로 사전 변환한 뒤, 변환된 임시 파일로 magick 호출한다', () => {
    const heic = makeFakeHeic('success-heif-convert')

    const { calls, runner } = makeRecorder((command, args) => {
      if (command === 'heif-convert') {
        // heif-convert [input, output] — output 실제로 생성해야 existsSync 통과
        writeFileSync(args[1], 'converted')
        return { status: 0 }
      }
      return { status: 0 }
    })

    const ok = runImageMagick([heic, '-resize', '500', '/out.jpg'], runner)

    assert.equal(ok, true)

    // 첫 호출은 heif-convert 여야 함
    assert.equal(calls[0].command, 'heif-convert')
    assert.equal(calls[0].args[0], heic)

    // 두 번째 호출부터는 magick 이며, 입력 경로가 원본 HEIC 가 아니라 변환된 임시 JPEG
    const magickCall = calls.find((c) => c.command === 'magick')
    assert.ok(magickCall, 'magick 이 호출되어야 함')
    assert.notEqual(magickCall!.args[0], heic, '원본 HEIC 대신 임시 파일을 써야 함')
    assert.ok(
      magickCall!.args[0].endsWith('.jpg'),
      `변환된 임시 파일은 .jpg 여야 함: ${magickCall!.args[0]}`
    )
    // 나머지 인자는 그대로 보존되어야 함
    assert.deepEqual(magickCall!.args.slice(1), ['-resize', '500', '/out.jpg'])
  })

  test('heif-convert 이 실패하면 sips 로 폴백한다', () => {
    const heic = makeFakeHeic('fallback-sips')

    const { calls, runner } = makeRecorder((command, args) => {
      if (command === 'heif-convert') {
        return { error: new Error('ENOENT'), status: null }
      }
      if (command === 'sips') {
        // sips 는 --out <path> 형태로 출력 경로를 지정
        const outIdx = args.indexOf('--out')
        writeFileSync(args[outIdx + 1], 'converted-by-sips')
        return { status: 0 }
      }
      return { status: 0 }
    })

    const ok = runImageMagick([heic, '/out.jpg'], runner)

    assert.equal(ok, true)
    assert.deepEqual(
      calls.map((c) => c.command).slice(0, 3),
      ['heif-convert', 'sips', 'magick'],
      'heif-convert 실패 → sips 성공 → magick 순서여야 함'
    )
  })

  test('외부 변환기가 모두 없으면 magick 의 `heic:` prefix 로 마지막 시도를 한다', () => {
    const heic = makeFakeHeic('fallback-heic-prefix')

    const { calls, runner } = makeRecorder((command, args) => {
      if (command === 'heif-convert' || command === 'sips') {
        return { error: new Error('ENOENT'), status: null }
      }
      // `heic:` prefix 로 들어오는 첫 magick 호출은 사전 변환 용도
      if (command === 'magick' && args[0]?.startsWith('heic:')) {
        writeFileSync(args[1], 'converted-by-magick-heic-prefix')
        return { status: 0 }
      }
      return { status: 0 }
    })

    const ok = runImageMagick([heic, '/out.jpg'], runner)

    assert.equal(ok, true)

    const preConvertCall = calls.find(
      (c) => c.command === 'magick' && c.args[0]?.startsWith('heic:')
    )
    assert.ok(preConvertCall, '`heic:` prefix 로 magick 호출이 한 번 있어야 함')
    assert.equal(preConvertCall!.args[0], `heic:${heic}`)
  })

  test('모든 사전 변환 시도가 실패하면 원본 HEIC 경로로라도 최종 실행을 시도한다 (하위 호환)', () => {
    const heic = makeFakeHeic('all-preconvert-fail')

    const { calls, runner } = makeRecorder((command, args) => {
      if (command === 'heif-convert' || command === 'sips') {
        return { error: new Error('ENOENT'), status: null }
      }
      if (args[0]?.startsWith('heic:')) {
        return { status: 1 } // pre-conversion via magick heic: 도 실패
      }
      // 시스템에 libheif 내장된 ImageMagick 이 있을 수도 있으니 마지막 시도는 수행
      return { status: 0 }
    })

    const ok = runImageMagick([heic, '/out.jpg'], runner)

    assert.equal(ok, true)

    const lastCall = calls[calls.length - 1]
    assert.equal(lastCall.command, 'magick')
    assert.equal(
      lastCall.args[0],
      heic,
      '사전 변환이 전부 실패했다면 원본 HEIC 경로로라도 시도해야 함'
    )
  })

  test('HEIC 가 아닌 입력은 사전 변환 경로를 아예 거치지 않는다', () => {
    const { calls, runner } = makeRecorder(() => ({ status: 0 }))

    runImageMagick(['/in.png', '/out.jpg'], runner)

    assert.equal(
      calls.some((c) => c.command === 'heif-convert' || c.command === 'sips'),
      false,
      'non-HEIC 입력은 heif-convert/sips 를 호출하지 말아야 함'
    )
    assert.equal(
      calls.some((c) => c.args[0]?.startsWith('heic:')),
      false,
      'non-HEIC 입력은 `heic:` prefix 를 붙이지 말아야 함'
    )
  })
})
