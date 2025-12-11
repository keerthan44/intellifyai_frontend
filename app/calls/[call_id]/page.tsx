"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, User, Bot, Phone, Globe, Calendar, Clock, MapPin, Zap, Flame, Loader2, MessageSquare, Database } from "lucide-react"

interface CallDetail {
  call_id: string
  input_data: Record<string, any>
  output_data: Record<string, any> | null
  created_at: string
  updated_at: string
  status: string
}

export default function CallDetailPage({ params }: { params: Promise<{ call_id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [callDetail, setCallDetail] = useState<CallDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCallDetail()
  }, [resolvedParams.call_id])

  const fetchCallDetail = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/calls/${resolvedParams.call_id}/detail`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Call not found")
        }
        throw new Error("Failed to fetch call details")
      }

      const data = await response.json()
      setCallDetail(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load call details")
      console.error("Error fetching call details:", err)
    } finally {
      setIsLoading(false)
    }
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
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
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
        className={`px-3 py-1 text-sm font-medium rounded-full border ${
          statusColors[status] || statusColors.pending
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !callDetail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <p className="text-destructive mb-4">{error || "Call not found"}</p>
          <Button onClick={() => router.push("/")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Card>
      </div>
    )
  }

  const inputData = callDetail.input_data
  const outputData = callDetail.output_data

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => router.push("/")}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                Call Details
              </h1>
              <p className="text-muted-foreground">
                Call ID: <span className="font-mono text-sm">{callDetail.call_id}</span>
              </p>
            </div>
            {getStatusBadge(callDetail.status)}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Customer Information */}
          <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/30">
            <div className="flex items-center gap-2 mb-6">
              <User className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold text-primary">Customer Information</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Full Name</p>
                <p className="text-lg font-semibold text-foreground">
                  {inputData.first_name} {inputData.last_name}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Address</p>
                <div className="space-y-1">
                  <p className="text-base text-foreground">{inputData.street_address}</p>
                  <p className="text-base text-foreground">{inputData.city}</p>
                  <p className="text-base font-semibold text-foreground uppercase">
                    {inputData.postal_code}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Contact Method</p>
                <div className="flex items-center gap-2">
                  {inputData.call_type === "phone" ? (
                    <>
                      <Phone className="w-4 h-4 text-primary" />
                      <span className="text-base text-foreground">
                        {inputData.phone_number || "N/A"}
                      </span>
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4 text-accent" />
                      <span className="text-base text-foreground">Web Call</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Company Information */}
          <Card className="p-6 bg-gradient-to-br from-accent/10 to-accent/5 border-2 border-accent/30">
            <div className="flex items-center gap-2 mb-6">
              <Bot className="w-6 h-6 text-accent" />
              <h2 className="text-xl font-bold text-accent">Company Information</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Company Name</p>
                <p className="text-lg font-semibold text-foreground">
                  {inputData.company_name || "N/A"}
                </p>
              </div>

              <div className="bg-accent/20 border border-accent/40 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-5 h-5 text-accent" />
                  <p className="text-sm font-semibold text-accent">Electricity</p>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Recommended Supplier</p>
                    <p className="text-base font-bold text-foreground">
                      {inputData.electricity_recommended_supplier || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Annual Cost</p>
                    <p className="text-xl font-bold text-accent">
                      £{inputData.electricity_quote_annual_cost || "N/A"}/year
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-primary/20 border border-primary/40 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Flame className="w-5 h-5 text-primary" />
                  <p className="text-sm font-semibold text-primary">Gas</p>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Recommended Supplier</p>
                    <p className="text-base font-bold text-foreground">
                      {inputData.gas_recommended_supplier || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Annual Cost</p>
                    <p className="text-xl font-bold text-primary">
                      £{inputData.gas_quote_annual_cost || "N/A"}/year
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Call Metadata */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-bold text-foreground mb-4">Call Metadata</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Created At</p>
                <p className="text-sm font-medium text-foreground">
                  {formatDate(callDetail.created_at)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-accent" />
              <div>
                <p className="text-xs text-muted-foreground">Last Updated</p>
                <p className="text-sm font-medium text-foreground">
                  {formatDate(callDetail.updated_at)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Request Type</p>
                <p className="text-sm font-medium text-foreground capitalize">
                  {inputData.request_type?.replace('_', ' ') || "N/A"}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Output Data - Collected Data */}
        {outputData && outputData.collected_data && (
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Data Collected</h2>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="space-y-3">
                {Object.entries(outputData.collected_data).map(([key, value]) => (
                  <div key={key} className="flex items-start gap-4 py-2 border-b border-border last:border-b-0">
                    <div className="flex-shrink-0 min-w-[200px]">
                      <p className="text-sm font-semibold text-muted-foreground">
                        {key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}:
                      </p>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground font-medium">
                        {typeof value === 'object' 
                          ? JSON.stringify(value, null, 2) 
                          : typeof value === 'boolean'
                            ? value ? 'Yes' : 'No'
                            : String(value)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Call Transcripts */}
        {outputData && outputData.call_transcripts && Array.isArray(outputData.call_transcripts) && outputData.call_transcripts.length > 0 && (
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-accent" />
              <h2 className="text-xl font-bold text-foreground">Conversation Transcript</h2>
            </div>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {outputData.call_transcripts.map((transcript: any, index: number) => {
                // Extract the actual response text (remove && {...} metadata)
                const cleanResponse = transcript.response?.split(' && ')[0] || transcript.response || ''
                const userMessage = transcript.user_message
                
                return (
                  <div key={index} className="space-y-3">
                    {/* User Message (if exists) */}
                    {userMessage && (
                      <div className="flex gap-3 flex-row-reverse">
                        {/* Avatar */}
                        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-primary/20 text-primary">
                          <User className="w-4 h-4" />
                        </div>
                        
                        {/* Message Bubble */}
                        <div className="flex-1 max-w-[80%] ml-auto">
                          <div className="rounded-lg p-3 bg-primary/10 border border-primary/20">
                            <p className="text-xs font-medium mb-1 text-primary">
                              Customer
                            </p>
                            <p className="text-sm text-foreground whitespace-pre-wrap">
                              {userMessage}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* AI Response */}
                    {cleanResponse && (
                      <div className="flex gap-3 flex-row">
                        {/* Avatar */}
                        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-accent/20 text-accent">
                          <Bot className="w-4 h-4" />
                        </div>
                        
                        {/* Message Bubble */}
                        <div className="flex-1 max-w-[80%] mr-auto">
                          <div className="rounded-lg p-3 bg-accent/10 border border-accent/20">
                            <p className="text-xs font-medium mb-1 text-accent">
                              AI Assistant
                            </p>
                            <p className="text-sm text-foreground whitespace-pre-wrap">
                              {cleanResponse}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {/* LLM Call History (alternative format) */}
        {outputData && !outputData.call_transcripts && outputData.llm_call_history && Array.isArray(outputData.llm_call_history) && outputData.llm_call_history.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-accent" />
              <h2 className="text-xl font-bold text-foreground">Conversation History</h2>
            </div>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {outputData.llm_call_history.map((message: any, index: number) => {
                const isAssistant = message.role === 'assistant' || message.role === 'agent'
                const isUser = message.role === 'user' || message.role === 'customer'
                
                return (
                  <div
                    key={index}
                    className={`flex gap-3 ${isAssistant ? 'flex-row' : 'flex-row-reverse'}`}
                  >
                    {/* Avatar */}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      isAssistant 
                        ? 'bg-accent/20 text-accent' 
                        : 'bg-primary/20 text-primary'
                    }`}>
                      {isAssistant ? (
                        <Bot className="w-4 h-4" />
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                    </div>
                    
                    {/* Message Bubble */}
                    <div className={`flex-1 max-w-[80%] ${isAssistant ? 'mr-auto' : 'ml-auto'}`}>
                      <div className={`rounded-lg p-3 ${
                        isAssistant 
                          ? 'bg-accent/10 border border-accent/20' 
                          : 'bg-primary/10 border border-primary/20'
                      }`}>
                        <p className={`text-xs font-medium mb-1 ${
                          isAssistant ? 'text-accent' : 'text-primary'
                        }`}>
                          {message.role === 'assistant' || message.role === 'agent' ? 'AI Assistant' : 'Customer'}
                        </p>
                        <p className="text-sm text-foreground whitespace-pre-wrap">
                          {message.content || message.message || message.text || 'No content'}
                        </p>
                        {message.timestamp && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(message.timestamp).toLocaleTimeString('en-GB', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {/* Raw Output Data (if no structured data) */}
        {outputData && !outputData.collected_data && !outputData.call_transcripts && !outputData.llm_call_history && (
          <Card className="p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Raw Call Output</h2>
            <div className="bg-muted/50 rounded-lg p-4">
              <pre className="text-sm text-foreground overflow-auto">
                {JSON.stringify(outputData, null, 2)}
              </pre>
            </div>
          </Card>
        )}

        {!outputData && (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">
              No output data available yet. The call may still be in progress or pending processing.
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}

