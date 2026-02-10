import { CodeBuildClient, StartBuildCommand } from '@aws-sdk/client-codebuild'

const client = new CodeBuildClient({})

function parseJson(name, raw, fallback) {
  if (!raw) return fallback
  try {
    return JSON.parse(raw)
  } catch (error) {
    throw new Error(`${name} must be valid JSON: ${error.message}`)
  }
}

function normalizeEnvironmentOverrides(overrides) {
  if (!Array.isArray(overrides)) {
    throw new Error('environmentOverrides must be an array')
  }

  return overrides.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`environmentOverrides[${index}] must be an object`)
    }
    if (!item.name || !item.value) {
      throw new Error(`environmentOverrides[${index}] requires name and value`)
    }
    return {
      name: String(item.name),
      value: String(item.value),
      type: item.type ? String(item.type) : 'PLAINTEXT',
    }
  })
}

export const handler = async (event = {}) => {
  const projectName = process.env.CODEBUILD_PROJECT_NAME
  if (!projectName) {
    throw new Error('CODEBUILD_PROJECT_NAME is required')
  }

  const defaultEnv = parseJson(
    'CODEBUILD_ENV_OVERRIDES_JSON',
    process.env.CODEBUILD_ENV_OVERRIDES_JSON,
    []
  )
  const eventEnv = event.environmentOverrides ?? []
  const environmentVariablesOverride = normalizeEnvironmentOverrides([...defaultEnv, ...eventEnv])

  const sourceVersion =
    event.sourceVersion ??
    process.env.CODEBUILD_SOURCE_VERSION ??
    process.env.CODEBUILD_GIT_BRANCH ??
    undefined

  const command = new StartBuildCommand({
    projectName,
    sourceVersion,
    environmentVariablesOverride,
  })

  const result = await client.send(command)
  const build = result.build ?? {}

  return {
    ok: true,
    message: 'CodeBuild triggered',
    projectName,
    buildId: build.id ?? null,
    buildArn: build.arn ?? null,
    buildNumber: build.buildNumber ?? null,
    sourceVersion: build.sourceVersion ?? sourceVersion ?? null,
  }
}
