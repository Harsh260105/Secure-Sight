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
        return <AlertTriangle className="h-4 w-4 text-red-500 dark:text-red-400" />
      case "Unauthorised Access":
        return <Shield className="h-4 w-4 text-orange-500 dark:text-orange-400" />
      case "Face Recognised":
        return <Eye className="h-4 w-4 text-blue-500 dark:text-blue-400" />
      case "Suspicious Activity":
        return <Activity className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />
      case "Motion Detection":
        return <Camera className="h-4 w-4 text-green-500 dark:text-green-400" />
      case "Equipment Tampering":
        return <Wrench className="h-4 w-4 text-purple-500 dark:text-purple-400" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500 dark:text-gray-400" />
    }
  }, [])

  const getIncidentColor = useCallback((type: string) => {
    switch (type) {
      case "Gun Threat":
        return "border-l-red-500 dark:border-l-red-400"
      case "Unauthorised Access":
        return "border-l-orange-500 dark:border-l-orange-400"
      case "Face Recognised":
        return "border-l-blue-500 dark:border-l-blue-400"
      case "Suspicious Activity":
        return "border-l-yellow-500 dark:border-l-yellow-400"
      case "Motion Detection":
        return "border-l-green-500 dark:border-l-green-400"
      case "Equipment Tampering":
        return "border-l-purple-500 dark:border-l-purple-400"
      default:
        return "border-l-gray-500 dark:border-l-gray-400"
    }
  }, [])

  const getSeverityColor = useCallback((severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/50 dark:border-red-800"
      case "high":
        return "text-orange-600 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-950/50 dark:border-orange-800"
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-950/50 dark:border-yellow-800"
      case "low":
        return "text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950/50 dark:border-green-800"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-950/50 dark:border-gray-800"
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

  // Filter incidents by resolution status
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
        <div className="relative">
          <Card
            ref={isSelected ? selectedIncidentRef : undefined}
            key={incident.id}
            className={`p-3 cursor-pointer transition-all duration-200 border-l-4 incident-card-hover ${getIncidentColor(incident.type)} ${
              isSelected
                ? "ring-2 ring-blue-500 dark:ring-blue-400 bg-blue-50 dark:bg-blue-950/30 shadow-lg border-blue-500 dark:border-blue-400"
                : "hover:shadow-md hover:bg-gray-50 dark:hover:bg-slate-800/50"
            } ${isResolving ? "opacity-50" : ""} bg-card dark:bg-slate-900 border-border dark:border-slate-800`}
            onClick={() => onIncidentSelect(incident)}
          >
            <div className="flex space-x-3">
              <img
                src={incident.thumbnailUrl || "/placeholder.svg?height=36&width=48&query=security+incident"}
                alt={`${incident.type} incident`}
                className="w-12 h-9 object-cover rounded flex-shrink-0"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    {getIncidentIcon(incident.type)}
                    <span className="font-medium text-sm truncate text-foreground">{incident.type}</span>
                    {/* Reserve space for selected badge to prevent layout shift */}
                    <div className="w-16 flex justify-end">
                      {/* {isSelected && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700"
                        >
                          SELECTED
                        </Badge>
                      )} */}
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    {incident.resolved && <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />}
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
                  <div className="flex items-center space-x-1 flex-1 min-w-0">
                    <Clock className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">
                      {formatTime(incident.tsStart)} - {formatTime(incident.tsEnd)}
                    </span>
                  </div>
                  <div className="flex flex-col items-end flex-shrink-0 ml-2">
                    <Badge
                      variant="outline"
                      className="text-xs mb-1 bg-background dark:bg-slate-800 border-border dark:border-slate-700"
                    >
                      {formatDuration(incident.tsStart, incident.tsEnd)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{formatFullDateTime(incident.tsStart).date}</span>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-border dark:border-slate-700">
                  <Button
                    size="sm"
                    variant="outline"
                    className={`w-full h-7 text-xs bg-transparent transition-colors border-border dark:border-slate-700 ${
                      incident.resolved
                        ? "hover:bg-orange-50 dark:hover:bg-orange-950/30 hover:text-orange-700 dark:hover:text-orange-300 hover:border-orange-300 dark:hover:border-orange-700"
                        : "hover:bg-green-50 dark:hover:bg-green-950/30 hover:text-green-700 dark:hover:text-green-300 hover:border-green-300 dark:hover:border-green-700"
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
        </div>
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
        <h2 className="text-xl font-bold text-foreground">All Incidents</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshIncidents}
          disabled={refreshing}
          className="h-8 bg-transparent border-border dark:border-slate-700 hover:bg-muted dark:hover:bg-slate-800"
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Summary */}
      <div className="mb-4 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-border dark:border-slate-700">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <span className="font-medium text-foreground">All Incidents</span>
            <Badge variant="outline" className="bg-background dark:bg-slate-900 border-border dark:border-slate-700">
              {allIncidents.length} total
            </Badge>
          </div>
          {selectedIncidentId && (
            <Badge
              variant="outline"
              className="bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700"
            >
              Timeline Sync Active
            </Badge>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2 mb-4 h-10 bg-muted dark:bg-slate-800">
          <TabsTrigger
            value="unresolved"
            className="flex items-center justify-center space-x-1 data-[state=active]:bg-red-600 dark:data-[state=active]:bg-red-700 data-[state=active]:text-white px-2 min-w-0"
          >
            <AlertTriangle className="h-3 w-3 flex-shrink-0" />
            <span className="text-xs font-medium min-w-0">
              Active <span className="hidden sm:inline">({unresolvedIncidents.length})</span>
              <span className="sm:hidden">({unresolvedIncidents.length})</span>
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="resolved"
            className="flex items-center justify-center space-x-1 data-[state=active]:bg-green-600 dark:data-[state=active]:bg-green-700 data-[state=active]:text-white px-2 min-w-0"
          >
            <CheckCircle className="h-3 w-3 flex-shrink-0" />
            <span className="text-xs font-medium min-w-0">
              Resolved <span className="hidden sm:inline">({resolvedIncidents.length})</span>
              <span className="sm:hidden">({resolvedIncidents.length})</span>
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="unresolved" className="flex-1 mt-0">
          <ScrollArea className="h-[calc(100vh)] rounded-lg" ref={scrollAreaRef}>
            <div className="space-y-3 pr-4 pt-2 ml-1">
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
          <ScrollArea className="h-[calc(100vh)] rounded-lg" ref={scrollAreaRef}>
            <div className="space-y-3 pr-4 pt-2 ml-1">
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
