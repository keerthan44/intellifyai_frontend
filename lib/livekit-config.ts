/**
 * LiveKit Configuration Module
 * Handles initialization and validation of LiveKit environment variables
 */

export interface LiveKitConfig {
  url: string
  apiKey: string
  apiSecret: string
  isConfigured: boolean
}

export function getLiveKitConfig(): LiveKitConfig {
  const url = process.env.LIVEKIT_URL
  const apiKey = process.env.LIVEKIT_API_KEY
  const apiSecret = process.env.LIVEKIT_API_SECRET

  const isConfigured = !!(url && apiKey && apiSecret)

  if (!isConfigured) {
    console.warn(
      [
        "[LiveKit] ⚠️  Missing configuration. Please set these environment variables:",
        "- LIVEKIT_URL: Your LiveKit server URL (e.g., ws://localhost:7880)",
        "- LIVEKIT_API_KEY: Your LiveKit API key",
        "- LIVEKIT_API_SECRET: Your LiveKit API secret",
        "",
        "Without these, voice calling will not work. Get started at: https://livekit.io/getting-started",
      ].join("\n"),
    )
  }

  return {
    url: url || "",
    apiKey: apiKey || "",
    apiSecret: apiSecret || "",
    isConfigured,
  }
}

export function validateLiveKitConfig(): boolean {
  const config = getLiveKitConfig()
  return config.isConfigured
}

export function getConfigurationStatus(): {
  configured: boolean
  missingVars: string[]
  setupUrl: string
} {
  const url = process.env.LIVEKIT_URL
  const apiKey = process.env.LIVEKIT_API_KEY
  const apiSecret = process.env.LIVEKIT_API_SECRET

  const missingVars: string[] = []

  if (!url) missingVars.push("LIVEKIT_URL")
  if (!apiKey) missingVars.push("LIVEKIT_API_KEY")
  if (!apiSecret) missingVars.push("LIVEKIT_API_SECRET")

  return {
    configured: missingVars.length === 0,
    missingVars,
    setupUrl: "https://livekit.io/getting-started",
  }
}
