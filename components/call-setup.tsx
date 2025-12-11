"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Phone, ChevronDown, User, Bot, History } from "lucide-react"

interface CallSetupProps {
  onStartCall: (config: {
    roomName: string
    callType: "web" | "phone"
    phoneNumber?: string
    accessToken: string
    liveKitUrl: string
    participantName: string
    metadata?: Record<string, string>
  }) => void
  onViewPastCalls?: () => void
}

// UK Postal Code Validation
// Supports all UK postcode formats including:
// - A9 9AA, A99 9AA, AA9 9AA, AA99 9AA (standard formats)
// - A9A 9AA, AA9A 9AA (London formats)
// - Special cases like GIR 0AA
const UK_POSTCODE_REGEX = /^([A-Z]{1,2}\d{1,2}[A-Z]?)\s?(\d[A-Z]{2})$/i

const validatePostalCode = (postalCode: string): boolean => {
  const trimmed = postalCode.trim().toUpperCase()
  if (!trimmed) return false
  
  // Special case for GIR 0AA (Girobank)
  if (trimmed === "GIR 0AA" || trimmed === "GIR0AA") return true
  
  return UK_POSTCODE_REGEX.test(trimmed)
}

export default function CallSetup({ onStartCall, onViewPastCalls }: CallSetupProps) {
  const [callType, setCallType] = useState<"web" | "phone">("web")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [firstName, setFirstName] = useState("John")
  const [lastName, setLastName] = useState("Smith")
  const [streetAddress, setStreetAddress] = useState("10 Downing Street")
  const [city, setCity] = useState("London")
  const [postalCode, setPostalCode] = useState("SW1A 1AA")
  const [companyName, setCompanyName] = useState("Energy Switch Ltd")
  const [electricityRecommendedSupplier, setElectricityRecommendedSupplier] = useState("Octopus Energy")
  const [electricityQuoteAnnualCost, setElectricityQuoteAnnualCost] = useState("850")
  const [gasRecommendedSupplier, setGasRecommendedSupplier] = useState("British Gas")
  const [gasQuoteAnnualCost, setGasQuoteAnnualCost] = useState("650")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)


  const handleStartCall = async () => {
    setError(null)

    // Validate required fields
    if (!firstName.trim()) {
      setError("Please enter your first name")
      return
    }

    if (!postalCode.trim()) {
      setError("Please enter your postcode")
      return
    }

    // Validate UK postal code format
    if (!validatePostalCode(postalCode)) {
      setError("Please enter a valid UK postcode (e.g., SW1A 1AA, EC1A 1BB, W1A 0AX)")
      return
    }

    if (callType === "phone" && !phoneNumber.trim()) {
      setError("Please enter a phone number")
      return
    }

    setIsLoading(true)
    try {
      // Metadata with customer info, address, phone_type, and company info
      const callMetadata = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        street_address: streetAddress.trim(),
        city: city.trim(),
        postal_code: postalCode.trim().toUpperCase(),
        phone_type: callType,
        request_type: "energy_switching",
        call_direction: "outbound",
        company_name: companyName.trim(),
        electricity_recommended_supplier: electricityRecommendedSupplier.trim(),
        electricity_quote_annual_cost: electricityQuoteAnnualCost.trim(),
        gas_recommended_supplier: gasRecommendedSupplier.trim(),
        gas_quote_annual_cost: gasQuoteAnnualCost.trim(),
      }

      const response = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callType,
          phoneNumber: callType === "phone" ? phoneNumber : undefined,
          metadata: callMetadata,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create call")
      }

      const data = await response.json()
      onStartCall({
        roomName: data.roomName,
        callType,
        phoneNumber: callType === "phone" ? phoneNumber : undefined,
        accessToken: data.accessToken,
        liveKitUrl: data.liveKitUrl,
        participantName: data.participantName,
        metadata: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          street_address: streetAddress.trim(),
          city: city.trim(),
          postal_code: postalCode.trim().toUpperCase(),
          phone_type: callType,
          request_type: "energy_switching",
          call_direction: "outbound",
          company_name: companyName.trim(),
          electricity_recommended_supplier: electricityRecommendedSupplier.trim(),
          electricity_quote_annual_cost: electricityQuoteAnnualCost.trim(),
          gas_recommended_supplier: gasRecommendedSupplier.trim(),
          gas_quote_annual_cost: gasQuoteAnnualCost.trim(),
        },
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to start call"
      console.error("[v0] Error starting call:", err)
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="py-12 min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-background via-background to-accent/10">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-6">
            <div className="relative w-16 h-16 bg-gradient-to-br from-accent to-primary rounded-2xl flex items-center justify-center shadow-lg">
              <Phone className="w-8 h-8 text-accent-foreground" />
              <div className="absolute inset-0 rounded-2xl border border-accent/30 animate-pulse"></div>
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-4">
            Energy Switch Assistant
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Request energy provider switching with our AI voice assistant
          </p>
          <div className="mt-4 flex items-center justify-center gap-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/20 rounded-full">
              <span className="inline-block w-2 h-2 rounded-full bg-accent animate-pulse"></span>
              <p className="text-sm font-medium text-accent">Outbound Call Initiation</p>
            </div>
            {onViewPastCalls && (
              <Button
                onClick={onViewPastCalls}
                variant="outline"
                size="sm"
                className="rounded-full"
              >
                <History className="w-4 h-4 mr-2" />
                View Past Calls
              </Button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Left Column - Customer & Call Information */}
          <Card className="relative overflow-hidden border border-border shadow-xl bg-card p-6">
            <div className="space-y-6">
              {/* Customer Information Section */}
              <div className="space-y-4 pb-6 border-b border-border">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Customer Information
              </h3>
              
              {/* Name Fields - Side by Side */}
              <div className="grid grid-cols-2 gap-3">
                {/* First Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    First Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    aria-label="First name"
                  />
                </div>

                {/* Last Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Last Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    aria-label="Last name"
                  />
                </div>
              </div>

              {/* Street Address */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Street Address <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., 10 Downing Street"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  aria-label="Street address"
                />
              </div>

              {/* City and Postcode - Side by Side */}
              <div className="grid grid-cols-2 gap-3">
                {/* City */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    City <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., London"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    aria-label="City"
                  />
                </div>

                {/* UK Postcode */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    UK Postcode <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., SW1A 1AA"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent uppercase"
                    aria-label="UK Postcode"
                    maxLength={8}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground -mt-2">
                Required to check available energy providers in your area
              </p>
            </div>

            {/* Call Type Section */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Phone className="w-5 h-5 text-accent" />
                Call Settings
              </h3>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Call Type</label>
                <div className="relative">
                <select
                  value={callType}
                  onChange={(e) => {
                    setCallType(e.target.value as "web" | "phone")
                    setPhoneNumber("")
                  }}
                  className="w-full appearance-none px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium"
                >
                    <option value="web">Web Call (Voice Assistant)</option>
                    <option value="phone">Phone Call</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                </div>
                <p className="text-xs text-muted-foreground">
                  {callType === "web" 
                    ? "Connect with our AI assistant via web browser" 
                    : "Receive a call on your phone number"}
                </p>
              </div>

              {callType === "phone" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    aria-label="Phone number for call"
                  />
                </div>
              )}
            </div>

            {/* Call Action Button */}
            <div className="pt-6">
              <Button
                onClick={handleStartCall}
              disabled={
                isLoading || 
                !firstName.trim() || 
                !lastName.trim() || 
                !streetAddress.trim() || 
                !city.trim() || 
                !postalCode.trim() || 
                (callType === "phone" && !phoneNumber.trim())
              }
                className="w-full h-14 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg"
              >
                {isLoading ? "Initiating Call..." : "Request Energy Switching Call"}
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-3">
                By clicking, you authorize us to initiate an outbound call to discuss energy switching options
              </p>
            </div>
            </div>
          </Card>

          {/* Right Column - Company Information */}
          <Card className="relative overflow-hidden border border-border shadow-xl bg-card p-6">
            <div className="space-y-6">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Bot className="w-5 h-5 text-accent" />
                Company Information
              </h3>
              
              {/* Company Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Company Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter company name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  aria-label="Company name"
                />
              </div>

              {/* Electricity Section */}
              <div className="bg-accent/5 border border-accent/20 rounded-lg p-4 space-y-3">
                <h4 className="text-sm font-semibold text-accent flex items-center gap-2">
                  ⚡ Electricity
                </h4>
                
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground">
                    Recommended Supplier <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Octopus Energy"
                    value={electricityRecommendedSupplier}
                    onChange={(e) => setElectricityRecommendedSupplier(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-sm"
                    aria-label="Electricity recommended supplier"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground">
                    Annual Quote Cost <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">£</span>
                    <input
                      type="number"
                      placeholder="850"
                      value={electricityQuoteAnnualCost}
                      onChange={(e) => setElectricityQuoteAnnualCost(e.target.value)}
                      className="w-full pl-7 pr-14 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-sm"
                      aria-label="Electricity quote annual cost"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">/year</span>
                  </div>
                </div>
              </div>

              {/* Gas Section */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
                <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
                  🔥 Gas
                </h4>
                
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground">
                    Recommended Supplier <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., British Gas"
                    value={gasRecommendedSupplier}
                    onChange={(e) => setGasRecommendedSupplier(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                    aria-label="Gas recommended supplier"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground">
                    Annual Quote Cost <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">£</span>
                    <input
                      type="number"
                      placeholder="650"
                      value={gasQuoteAnnualCost}
                      onChange={(e) => setGasQuoteAnnualCost(e.target.value)}
                      className="w-full pl-7 pr-14 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                      aria-label="Gas quote annual cost"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">/year</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 text-center mt-12">
          <div>
            <div className="text-2xl font-bold text-accent">AI</div>
            <p className="text-xs text-muted-foreground">Powered</p>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">24/7</div>
            <p className="text-xs text-muted-foreground">Available</p>
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground/60">Fast</div>
            <p className="text-xs text-muted-foreground">Switching</p>
          </div>
        </div>
      </div>
    </div>
  )
}
