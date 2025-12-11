"use client"

import { useEffect, useState } from "react"
import { AlertCircle, CheckCircle2, ExternalLink } from "lucide-react"
import { Card } from "@/components/ui/card"

interface ConfigStatus {
  configured: boolean
  missingVars: string[]
  setupUrl: string
}

export default function LiveKitStatus() {
  const [status, setStatus] = useState<ConfigStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStatus() {
      try {
        const response = await fetch("/api/livekit-status")
        const data = await response.json()
        setStatus(data)
      } catch (error) {
        console.error("[v0] Error fetching LiveKit status:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStatus()
  }, [])

  if (loading) return null

  if (!status) return null

  if (!status.configured) {
    return (
      <Card className="border border-amber-200 bg-amber-50 p-4 rounded-lg">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-amber-900 mb-2">LiveKit Configuration Required</h3>
            <p className="text-sm text-amber-800 mb-3">Add these environment variables to enable voice calling:</p>
            <ul className="text-sm text-amber-800 mb-4 space-y-1">
              {status.missingVars.map((varName) => (
                <li key={varName}>
                  • <code className="bg-amber-100 px-2 py-0.5 rounded">{varName}</code>
                </li>
              ))}
            </ul>
            <a
              href={status.setupUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-amber-700 hover:text-amber-900 underline"
            >
              Get Started with LiveKit
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="border border-green-200 bg-green-50 p-4 rounded-lg">
      <div className="flex gap-3">
        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-green-900">LiveKit Configured</h3>
          <p className="text-sm text-green-800">Voice calling is ready to use</p>
        </div>
      </div>
    </Card>
  )
}
