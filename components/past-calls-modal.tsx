"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { X, ChevronLeft, ChevronRight, Phone, Globe, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface Call {
  call_id: string
  customer_name: string
  call_type: string
  phone_number: string | null
  postal_code: string
  created_at: string
  has_output: boolean
  status: string
}

interface PastCallsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function PastCallsModal({ isOpen, onClose }: PastCallsModalProps) {
  const router = useRouter()
  const [calls, setCalls] = useState<Call[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const limit = 10

  useEffect(() => {
    if (isOpen) {
      fetchCalls(page)
    }
  }, [isOpen, page])

  const fetchCalls = async (pageNum: number) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/calls/list?page=${pageNum}&limit=${limit}`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch calls")
      }

      const data = await response.json()
      setCalls(data.calls)
      setHasMore(data.pagination.hasMore)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load calls")
      console.error("Error fetching calls:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRowClick = (callId: string) => {
    router.push(`/calls/${callId}`)
    onClose()
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    
    const date = new Date(dateString)
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.error("Invalid date:", dateString)
      return "Invalid Date"
    }
    
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      successful: "bg-green-500/20 text-green-700 border-green-500/30",
      completed: "bg-blue-500/20 text-blue-700 border-blue-500/30",
      pending: "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
      failed: "bg-red-500/20 text-red-700 border-red-500/30",
    }

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full border ${
          statusColors[status] || statusColors.pending
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden bg-card border border-border shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Past Calls</h2>
            <p className="text-sm text-muted-foreground mt-1">
              View and manage your call history
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="overflow-auto max-h-[calc(90vh-200px)]">
          {isLoading && calls.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={() => fetchCalls(page)} variant="outline">
                Retry
              </Button>
            </div>
          ) : calls.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Phone className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No calls found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Postcode
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {calls.map((call) => (
                    <tr
                      key={call.call_id}
                      onClick={() => handleRowClick(call.call_id)}
                      className="hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-foreground">
                          {call.customer_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {call.call_type === "phone" ? (
                            <Phone className="w-4 h-4 text-primary" />
                          ) : (
                            <Globe className="w-4 h-4 text-accent" />
                          )}
                          <span className="text-sm text-foreground capitalize">
                            {call.call_type}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-muted-foreground">
                          {call.phone_number || "Web"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-foreground uppercase">
                          {call.postal_code}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-muted-foreground">
                          {formatDate(call.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(call.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer with Pagination */}
        <div className="flex items-center justify-between p-6 border-t border-border">
          <div className="text-sm text-muted-foreground">
            Page {page} {hasMore && "• More results available"}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasMore || isLoading}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

