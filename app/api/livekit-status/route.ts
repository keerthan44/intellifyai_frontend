import { getConfigurationStatus } from "@/lib/livekit-config"

export async function GET() {
  const status = getConfigurationStatus()

  return Response.json(status, {
    status: status.configured ? 200 : 503,
  })
}
