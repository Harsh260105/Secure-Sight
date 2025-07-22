"use client"

import type React from "react"

import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import { AlertTriangle, Eye, Shield, Activity, Camera, Wrench, CheckCircle, Clock, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface IncidentWithCamera {
  id: number
  cameraId: number
  type: string
  tsStart: string
  tsEnd: string
  thumbnailUrl: string
  resolved: boolean
  severity: string
  description: string | null
  camera: {
    id: number
    name: string
    location: string
    status: string
  }
}

interface IncidentListProps {
  onIncidentSelect: (incident: IncidentWithCamera) => void
  selectedIncidentId?: number
  allIncidents: IncidentWithCamera[]
  onIncidentResolve: (incidentId: number, newResolvedState: boolean) => void
  onRefresh: () => void
  // Remove selectedDate and onDateChange props
}

export function IncidentList({
  onIncidentSelect,
  selectedIncidentId,
  allIncidents,
  onIncidentResolve,
  onRefresh,
}: IncidentListProps) {
  const [resolvingIds, setResolvingIds] = useState<Set<number>>(new Set())
  const [activeTab, setActiveTab] = useState("unresolved")
  const [refreshing, setRefreshing] = useState(false)
  // Remove these lines:
  // const [localSelectedDate, setLocalSelectedDate] = useState<string>(() => {
  //   return selectedDate || new Date().toISOString().split("T")[0]
  // })

  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const selectedIncidentRef = useRef<HTMLDivElement>(null)

  const formatFullDateTime = useCallback((dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }
  }, [])

  // Remove the useEffect for selectedDate sync

  // Remove the handleDateChange function

  // Auto-scroll to selected incident when it changes
  useEffect(() => {
    if (selectedIncidentId && selectedIncidentRef.current && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        const selectedElement = selectedIncidentRef.current
        const containerRect = scrollContainer.getBoundingClientRect()
        const elementRect = selectedElement.getBoundingClientRect()

        // Check if element is not fully visible
        if (elementRect.top < containerRect.top || elementRect.bottom > containerRect.bottom) {
          selectedElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          })
        }
      }
    }
  }, [selectedIncidentId])

  // Refresh incidents
  const refreshIncidents = useCallback(async () => {
    setRefreshing(true)
    await onRefresh()
    setTimeout(() => setRefreshing(false), 1000)
  }, [onRefresh])

  // Handle tab change
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value)
  }, [])

  const handleResolve = useCallback(
    async (incidentId: number, event: React.MouseEvent) => {
      event.stopPropagation()

      // Find current incident to determine new state
      const currentIncident = allIncidents.find((inc) => inc.id === incidentId)
      if (!currentIncident) return

      const newResolvedState = !currentIncident.resolved

      // Optimistic update first
      onIncidentResolve(incidentId, newResolvedState)
      setResolvingIds((prev) => new Set(prev).add(incidentId))

      try {
        const response = await fetch(`/api/incidents/${incidentId}/resolve`, {
          method: "PATCH",
        })

        if (!response.ok) {
          // Revert optimistic update on error
          onIncidentResolve(incidentId, currentIncident.resolved)
          throw new Error("Failed to resolve incident")
        }

        console.log("Successfully resolved incident:", incidentId)
      } catch (error) {
        console.error("Error resolving incident:", error)
        // Optimistic update already reverted above
      } finally {
        setResolvingIds((prev) => {
          const newSet = new Set(prev)
          newSet.delete(incidentId)
          return newSet
        })
      }
    },
    [allIncidents, onIncidentResolve],
  )

  const getIncidentIcon = useCallback((type: string) => {
    switch (type) {
      case "Gun Threat":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "Unauthorised Access":
        return <Shield className="h-4 w-4 text-orange-500" />
      case "Face Recognised":
        return <Eye className="h-4 w-4 text-blue-500" />
      case "Suspicious Activity":
        return <Activity className="h-4 w-4 text-yellow-500" />
      case "Motion Detection":
        return <Camera className="h-4 w-4 text-green-500" />
      case "Equipment Tampering":
        return <Wrench className="h-4 w-4 text-purple-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }, [])

  const getIncidentColor = useCallback((type: string) => {
    switch (type) {
      case "Gun Threat":
        return "border-l-red-500"
      case "Unauthorised Access":
        return "border-l-orange-500"
      case "Face Recognised":
        return "border-l-blue-500"
      case "Suspicious Activity":
        return "border-l-yellow-500"
      case "Motion Detection":
        return "border-l-green-500"
      case "Equipment Tampering":
        return "border-l-purple-500"
      default:
        return "border-l-gray-500"
    }
  }, [])

  const getSeverityColor = useCallback((severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-600 bg-red-50 border-red-200"
      case "high":
        return "text-orange-600 bg-orange-50 border-orange-200"
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200"
      case "low":
        return "text-green-600 bg-green-50 border-green-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }, [])

  const formatTime = useCallback((dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }, [])

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }, [])

  const formatDuration = useCallback((start: string, end: string) => {
    const startTime = new Date(start).getTime()
    const endTime = new Date(end).getTime()
    const duration = Math.floor((endTime - startTime) / 1000)

    const minutes = Math.floor(duration / 60)
    const seconds = duration % 60

    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }, [])

  // Replace the dateFilteredIncidents logic with:
  const { unresolvedIncidents, resolvedIncidents, currentIncidents } = useMemo(() => {
    // Show ALL incidents, no date filtering
    const unresolved = allIncidents.filter((incident) => !incident.resolved)
    const resolved = allIncidents.filter((incident) => incident.resolved)
    const current = activeTab === "unresolved" ? unresolved : resolved

    return {
      unresolvedIncidents: unresolved,
      resolvedIncidents: resolved,
      currentIncidents: current,
    }
  }, [allIncidents, activeTab])

  const IncidentCard = useCallback(
    ({ incident }: { incident: IncidentWithCamera }) => {
      const isResolving = resolvingIds.has(incident.id)
      const isSelected = selectedIncidentId === incident.id

      return (
        <Card
          ref={isSelected ? selectedIncidentRef : undefined}
          key={incident.id}
          className={`p-3 cursor-pointer transition-all duration-200 border-l-4 w-full ${getIncidentColor(incident.type)} ${
            isSelected
              ? "ring-2 ring-blue-500 bg-blue-50 shadow-lg border-blue-500"
              : "hover:shadow-md hover:bg-gray-50"
          } ${isResolving ? "opacity-50" : ""}`}
          onClick={() => onIncidentSelect(incident)}
        >
          <div className="flex space-x-3">
            <img
              src={incident.thumbnailUrl || "/placeholder.svg?height=36&width=48&query=security+camera"}
              alt={`${incident.type} incident`}
              className="w-12 h-9 object-cover rounded flex-shrink-0"
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-2">
                  {getIncidentIcon(incident.type)}
                  <span className="font-medium text-sm truncate">{incident.type}</span>
                  {isSelected && (
                    <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300">
                      SELECTED
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  {incident.resolved && <CheckCircle className="h-4 w-4 text-green-500" />}
                  <Badge variant="outline" className={`text-xs ${getSeverityColor(incident.severity)}`}>
                    {incident.severity.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <p className="text-xs text-muted-foreground truncate mb-1">
                {incident.camera.name} - {incident.camera.location}
              </p>

              {incident.description && (
                <p className="text-xs text-muted-foreground truncate mb-1 italic">{incident.description}</p>
              )}

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>
                    {formatTime(incident.tsStart)} - {formatTime(incident.tsEnd)}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <Badge variant="outline" className="text-xs mb-1">
                    {formatDuration(incident.tsStart, incident.tsEnd)}
                  </Badge>
                  <span className="text-xs text-gray-500">{formatFullDateTime(incident.tsStart).date}</span>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  className={`w-full h-7 text-xs bg-transparent transition-colors ${
                    incident.resolved
                      ? "hover:bg-orange-50 hover:text-orange-700 hover:border-orange-300"
                      : "hover:bg-green-50 hover:text-green-700 hover:border-green-300"
                  }`}
                  onClick={(e) => handleResolve(incident.id, e)}
                  disabled={isResolving}
                >
                  {isResolving ? (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      {incident.resolved ? "Reopening..." : "Resolving..."}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {incident.resolved ? "Reopen Incident" : "Mark as Resolved"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )
    },
    [
      resolvingIds,
      selectedIncidentId,
      getIncidentColor,
      getIncidentIcon,
      getSeverityColor,
      formatTime,
      formatDate,
      formatDuration,
      handleResolve,
      onIncidentSelect,
    ],
  )

  return (
    <div className="h-full flex flex-col">
      {/* Header with refresh button only */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">All Incidents</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshIncidents}
          disabled={refreshing}
          className="h-8 bg-transparent"
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Summary */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <span className="font-medium">All Incidents</span>
            <Badge variant="outline" className="bg-white">
              {allIncidents.length} total
            </Badge>
          </div>
          {selectedIncidentId && (
            <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
              Timeline Sync Active
            </Badge>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2 mb-4 h-10">
          <TabsTrigger
            value="unresolved"
            className="flex items-center justify-center space-x-1 data-[state=active]:bg-red-600 data-[state=active]:text-white px-2 min-w-0"
          >
            <AlertTriangle className="h-3 w-3 flex-shrink-0" />
            <span className="text-xs font-medium min-w-0">
              Active <span className="hidden sm:inline">({unresolvedIncidents.length})</span>
              <span className="sm:hidden">({unresolvedIncidents.length})</span>
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="resolved"
            className="flex items-center justify-center space-x-1 data-[state=active]:bg-green-600 data-[state=active]:text-white px-2 min-w-0"
          >
            <CheckCircle className="h-3 w-3 flex-shrink-0" />
            <span className="text-xs font-medium min-w-0">
              Resolved <span className="hidden sm:inline">({resolvedIncidents.length})</span>
              <span className="sm:hidden">({resolvedIncidents.length})</span>
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="unresolved" className="flex-1 mt-0">
          <ScrollArea className="h-[calc(100vh)]" ref={scrollAreaRef}>
            <div className="space-y-3 pr-4 pt-2">
              {currentIncidents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">No active incidents</p>
                  <p className="text-sm">All incidents have been resolved</p>
                </div>
              ) : (
                currentIncidents.map((incident) => <IncidentCard key={incident.id} incident={incident} />)
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="resolved" className="flex-1 mt-0">
          <ScrollArea className="h-[calc(100vh)]" ref={scrollAreaRef}>
            <div className="space-y-3 pr-4 pt-2">
              {currentIncidents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">No resolved incidents</p>
                  <p className="text-sm">No resolved incidents</p>
                </div>
              ) : (
                currentIncidents.map((incident) => <IncidentCard key={incident.id} incident={incident} />)
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}
