"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Camera,
  RefreshCw,
  Clock,
  Calendar,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Target,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface IncidentWithCamera {
  id: number
  type: string
  tsStart: string
  tsEnd: string
  severity: string
  camera: {
    id: number
    name: string
    location: string
  }
}

interface IncidentTimelineProps {
  incidents: IncidentWithCamera[]
  onTimeChange: (timestamp: string) => void
  onIncidentSelect: (incident: any) => void
  selectedIncident?: any
  selectedDate?: string
  onDateChange?: (date: string) => void
}

// Zoom levels in hours
const ZOOM_LEVELS = [
  { label: "24h", hours: 24 },
  { label: "12h", hours: 12 },
  { label: "6h", hours: 6 },
  { label: "3h", hours: 3 },
  { label: "1h", hours: 1 },
  { label: "30m", hours: 0.5 },
]

export function IncidentTimeline({
  incidents,
  onTimeChange,
  onIncidentSelect,
  selectedIncident,
  selectedDate,
  onDateChange,
}: IncidentTimelineProps) {
  console.log("Timeline rendering with incidents:", incidents.length)

  // Date and time state
  const [localSelectedDate, setLocalSelectedDate] = useState<string>(() => {
    return selectedDate || new Date().toISOString().split("T")[0]
  })

  const [currentTime, setCurrentTime] = useState<Date>(() => {
    const now = new Date()
    now.setHours(12, 0, 0, 0) // Start at noon
    return now
  })

  // Timeline control state
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [zoomLevel, setZoomLevel] = useState(0) // Index into ZOOM_LEVELS
  const [viewportStart, setViewportStart] = useState<Date>(() => {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    return start
  })

  const timelineRef = useRef<SVGSVGElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Timeline dimensions
  const timelineWidth = 1200
  const headerHeight = 50
  const cameraRowHeight = 50
  const leftPanelWidth = 200

  // Current zoom configuration
  const currentZoom = ZOOM_LEVELS[zoomLevel]
  const viewportHours = currentZoom.hours

  // Calculate viewport end based on start and zoom level
  const viewportEnd = useMemo(() => {
    const end = new Date(viewportStart)
    end.setTime(end.getTime() + viewportHours * 60 * 60 * 1000)
    return end
  }, [viewportStart, viewportHours])

  // Sync with parent component's selected date
  useEffect(() => {
    if (selectedDate && selectedDate !== localSelectedDate) {
      setLocalSelectedDate(selectedDate)
    }
  }, [selectedDate, localSelectedDate])

  // Update viewport when date changes
  useEffect(() => {
    const newStart = new Date(localSelectedDate)
    newStart.setHours(0, 0, 0, 0)
    setViewportStart(newStart)

    // Update current time to be within the new date
    const newCurrentTime = new Date(localSelectedDate)
    newCurrentTime.setHours(12, 0, 0, 0)
    setCurrentTime(newCurrentTime)
  }, [localSelectedDate])

  // Auto-focus on selected incident
  useEffect(() => {
    if (selectedIncident) {
      const incidentTime = new Date(selectedIncident.tsStart)
      const incidentDate = incidentTime.toISOString().split("T")[0]

      // If incident is on a different date, switch to that date
      if (incidentDate !== localSelectedDate) {
        setLocalSelectedDate(incidentDate)
        onDateChange?.(incidentDate)
      }

      // Center the viewport on the incident
      const incidentHour = incidentTime.getHours()
      const newViewportStart = new Date(incidentTime)
      newViewportStart.setHours(Math.max(0, incidentHour - viewportHours / 2), 0, 0, 0)

      // Ensure viewport doesn't go outside the day
      const dayStart = new Date(incidentDate)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(incidentDate)
      dayEnd.setHours(23, 59, 59, 999)

      if (newViewportStart < dayStart) {
        newViewportStart.setTime(dayStart.getTime())
      }

      const newViewportEnd = new Date(newViewportStart.getTime() + viewportHours * 60 * 60 * 1000)
      if (newViewportEnd > dayEnd) {
        newViewportStart.setTime(dayEnd.getTime() - viewportHours * 60 * 60 * 1000)
      }

      setViewportStart(newViewportStart)
      setCurrentTime(incidentTime)
    }
  }, [selectedIncident, localSelectedDate, viewportHours, onDateChange])

  // Get unique cameras from incidents
  const cameras = useMemo(() => {
    const allCameras = Array.from(new Map(incidents.map((inc) => [inc.camera.id, inc.camera])).values())

    // If no cameras from incidents, create some default ones for display
    const defaultCameras =
      allCameras.length > 0
        ? []
        : [
            { id: 1, name: "Shop Floor A", location: "Main Production Area" },
            { id: 2, name: "Vault Camera", location: "Security Vault - Level B1" },
            { id: 3, name: "Main Entrance", location: "Building Entrance - Ground Floor" },
            { id: 4, name: "Parking Lot", location: "Employee Parking Area" },
            { id: 5, name: "Server Room", location: "IT Infrastructure - Level 2" },
          ]

    return [...allCameras, ...defaultCameras].sort((a, b) => a.id - b.id)
  }, [incidents])

  useEffect(() => {
    setMounted(true)
  }, [])

  const timeToX = useCallback(
    (time: Date) => {
      const totalMs = viewportEnd.getTime() - viewportStart.getTime()
      const currentMs = time.getTime() - viewportStart.getTime()
      return Math.max(0, Math.min(timelineWidth, (currentMs / totalMs) * timelineWidth))
    },
    [viewportStart, viewportEnd, timelineWidth],
  )

  const xToTime = useCallback(
    (x: number) => {
      const totalMs = viewportEnd.getTime() - viewportStart.getTime()
      const ratio = Math.max(0, Math.min(1, x / timelineWidth))
      return new Date(viewportStart.getTime() + ratio * totalMs)
    },
    [viewportStart, viewportEnd, timelineWidth],
  )

  // Generate time markers based on zoom level
  const timeMarkers = useMemo(() => {
    const markers = []
    const totalHours = viewportHours

    let interval: number
    let format: Intl.DateTimeFormatOptions

    if (totalHours <= 1) {
      interval = 5 // 5 minutes
      format = { hour: "2-digit", minute: "2-digit" }
    } else if (totalHours <= 6) {
      interval = 30 // 30 minutes
      format = { hour: "2-digit", minute: "2-digit" }
    } else if (totalHours <= 12) {
      interval = 60 // 1 hour
      format = { hour: "2-digit", minute: "2-digit" }
    } else {
      interval = 120 // 2 hours
      format = { hour: "2-digit", minute: "2-digit" }
    }

    const startTime = new Date(viewportStart)
    const endTime = new Date(viewportEnd)

    // Round start time to nearest interval
    const startMinutes = Math.floor(startTime.getMinutes() / interval) * interval
    startTime.setMinutes(startMinutes, 0, 0)

    const currentTime = new Date(startTime)

    while (currentTime <= endTime) {
      const x = timeToX(currentTime)
      if (x >= 0 && x <= timelineWidth) {
        markers.push({
          time: new Date(currentTime),
          x,
          label: currentTime.toLocaleTimeString("en-US", format),
          isHour: currentTime.getMinutes() === 0,
        })
      }
      currentTime.setMinutes(currentTime.getMinutes() + interval)
    }

    return markers
  }, [viewportStart, viewportEnd, viewportHours, timeToX])

  const getIncidentColor = useCallback((incident: IncidentWithCamera) => {
    switch (incident.severity) {
      case "critical":
        return "#dc2626"
      case "high":
        return "#ea580c"
      case "medium":
        return "#ca8a04"
      case "low":
        return "#16a34a"
      default:
        switch (incident.type) {
          case "Gun Threat":
            return "#ef4444"
          case "Unauthorised Access":
            return "#f97316"
          case "Face Recognised":
            return "#3b82f6"
          case "Suspicious Activity":
            return "#eab308"
          case "Motion Detection":
            return "#22c55e"
          case "Equipment Tampering":
            return "#a855f7"
          default:
            return "#6b7280"
        }
    }
  }, [])

  // Filter incidents to only show those in current viewport and selected date
  const visibleIncidents = useMemo(() => {
    const selectedDateStart = new Date(localSelectedDate)
    selectedDateStart.setHours(0, 0, 0, 0)
    const selectedDateEnd = new Date(localSelectedDate)
    selectedDateEnd.setHours(23, 59, 59, 999)

    return incidents.filter((incident) => {
      const incidentStart = new Date(incident.tsStart)
      const incidentEnd = new Date(incident.tsEnd)

      // Check if incident is on the selected date
      const isOnSelectedDate = incidentStart >= selectedDateStart && incidentStart <= selectedDateEnd

      // Check if incident overlaps with current viewport
      const overlapsViewport = incidentStart < viewportEnd && incidentEnd > viewportStart

      return isOnSelectedDate && overlapsViewport
    })
  }, [incidents, localSelectedDate, viewportStart, viewportEnd])

  const handleTimelineClick = useCallback(
    (event: React.MouseEvent<SVGSVGElement>) => {
      if (!timelineRef.current || isDragging) return

      const rect = timelineRef.current.getBoundingClientRect()
      const x = event.clientX - rect.left
      const newTime = xToTime(x)

      setCurrentTime(newTime)
      setTimeout(() => {
        onTimeChange(newTime.toISOString())
      }, 0)
    },
    [isDragging, xToTime, onTimeChange],
  )

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    event.preventDefault()
    setIsDragging(true)
    setIsPlaying(false)
  }, [])

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!isDragging || !timelineRef.current) return

      const rect = timelineRef.current.getBoundingClientRect()
      const x = Math.max(0, Math.min(timelineWidth, event.clientX - rect.left))
      const newTime = xToTime(x)

      setCurrentTime(newTime)
      setTimeout(() => {
        onTimeChange(newTime.toISOString())
      }, 0)
    },
    [isDragging, xToTime, onTimeChange, timelineWidth],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying || !mounted) return

    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        const increment = viewportHours <= 1 ? 1000 * 60 * playbackSpeed : 1000 * 60 * playbackSpeed * 5
        const newTime = new Date(prev.getTime() + increment)

        if (newTime > viewportEnd) {
          setIsPlaying(false)
          return prev
        }

        setTimeout(() => {
          onTimeChange(newTime.toISOString())
        }, 0)
        return newTime
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isPlaying, playbackSpeed, viewportEnd, viewportHours, onTimeChange, mounted])

  // Navigation functions
  const jumpToStart = useCallback(() => {
    setCurrentTime(viewportStart)
    onTimeChange(viewportStart.toISOString())
    setIsPlaying(false)
  }, [viewportStart, onTimeChange])

  const jumpToEnd = useCallback(() => {
    setCurrentTime(viewportEnd)
    onTimeChange(viewportEnd.toISOString())
    setIsPlaying(false)
  }, [viewportEnd, onTimeChange])

  const jumpToIncident = useCallback(
    (incident: IncidentWithCamera) => {
      const incidentTime = new Date(incident.tsStart)
      setCurrentTime(incidentTime)
      onTimeChange(incidentTime.toISOString())
      onIncidentSelect(incident)
      setIsPlaying(false)
    },
    [onTimeChange, onIncidentSelect],
  )

  // Focus on selected incident
  const focusOnSelectedIncident = useCallback(() => {
    if (selectedIncident) {
      jumpToIncident(selectedIncident)
    }
  }, [selectedIncident, jumpToIncident])

  // Zoom functions
  const zoomIn = useCallback(() => {
    if (zoomLevel < ZOOM_LEVELS.length - 1) {
      setZoomLevel(zoomLevel + 1)
      setIsPlaying(false)
    }
  }, [zoomLevel])

  const zoomOut = useCallback(() => {
    if (zoomLevel > 0) {
      setZoomLevel(zoomLevel - 1)
      setIsPlaying(false)
    }
  }, [zoomLevel])

  // Pan functions
  const panLeft = useCallback(() => {
    const panAmount = viewportHours * 0.25 * 60 * 60 * 1000
    const newStart = new Date(viewportStart.getTime() - panAmount)

    const dayStart = new Date(localSelectedDate)
    dayStart.setHours(0, 0, 0, 0)

    if (newStart >= dayStart) {
      setViewportStart(newStart)
    }
    setIsPlaying(false)
  }, [viewportStart, viewportHours, localSelectedDate])

  const panRight = useCallback(() => {
    const panAmount = viewportHours * 0.25 * 60 * 60 * 1000
    const newStart = new Date(viewportStart.getTime() + panAmount)

    const dayEnd = new Date(localSelectedDate)
    dayEnd.setHours(23, 59, 59, 999)
    const newEnd = new Date(newStart.getTime() + viewportHours * 60 * 60 * 1000)

    if (newEnd <= dayEnd) {
      setViewportStart(newStart)
    }
    setIsPlaying(false)
  }, [viewportStart, viewportHours, localSelectedDate])

  // Handle date change
  const handleDateChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newDate = event.target.value
      setLocalSelectedDate(newDate)
      onDateChange?.(newDate)
      setIsPlaying(false)
    },
    [onDateChange],
  )

  const currentX = useMemo(() => timeToX(currentTime), [currentTime, timeToX])
  const totalHeight = headerHeight + cameras.length * cameraRowHeight

  // Process incidents for rendering
  const processedIncidents = useMemo(() => {
    return visibleIncidents
      .map((incident) => {
        const startTime = new Date(incident.tsStart)
        const endTime = new Date(incident.tsEnd)

        if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
          return null
        }

        const startX = timeToX(startTime)
        const endX = timeToX(endTime)
        const width = Math.max(8, endX - startX)
        const color = getIncidentColor(incident)
        const isSelected = selectedIncident?.id === incident.id

        const cameraIndex = cameras.findIndex((c) => c.id === incident.camera.id)
        const finalCameraIndex = cameraIndex === -1 ? 0 : cameraIndex

        const y = headerHeight + finalCameraIndex * cameraRowHeight + 12
        const height = cameraRowHeight - 24

        return {
          ...incident,
          startX,
          width,
          y,
          height,
          color,
          isSelected,
          startTime,
          endTime,
        }
      })
      .filter(Boolean)
  }, [visibleIncidents, cameras, timeToX, getIncidentColor, selectedIncident])

  if (!mounted) {
    return (
      <Card className="p-6 bg-gray-900 text-white">
        <div className="space-y-4">
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-400" />
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 bg-gray-900 text-white">
      <div className="space-y-6">
        {/* Timeline Controls */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-4">
            {/* Date Selection */}
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={localSelectedDate}
                onChange={handleDateChange}
                className="text-sm bg-gray-800 border border-gray-700 rounded px-3 py-1 text-white"
              />
            </div>

            {/* Playback Controls */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={jumpToStart}
                className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 h-8 w-8"
              >
                <SkipBack className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsPlaying(!isPlaying)}
                className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 h-8 w-8"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={jumpToEnd}
                className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 h-8 w-8"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            {/* Speed Control */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">Speed:</span>
              <select
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                className="text-sm bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white"
              >
                <option value={0.5}>0.5x</option>
                <option value={1}>1x</option>
                <option value={2}>2x</option>
                <option value={4}>4x</option>
              </select>
            </div>

            {/* Focus on Selected Incident */}
            {selectedIncident && (
              <Button
                variant="outline"
                size="sm"
                onClick={focusOnSelectedIncident}
                className="text-xs h-7 bg-blue-800 border-blue-600 text-blue-200 hover:bg-blue-700"
              >
                <Target className="h-3 w-3 mr-1" />
                Focus Selected
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {/* Pan Controls */}
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={panLeft}
                disabled={viewportStart <= new Date(localSelectedDate + "T00:00:00")}
                className="text-xs h-7 bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={panRight}
                disabled={viewportEnd >= new Date(localSelectedDate + "T23:59:59")}
                className="text-xs h-7 bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={zoomOut}
                disabled={zoomLevel === 0}
                className="text-xs h-7 bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <ZoomOut className="h-3 w-3" />
              </Button>
              <span className="text-sm text-gray-400 min-w-[3rem] text-center">{currentZoom.label}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={zoomIn}
                disabled={zoomLevel === ZOOM_LEVELS.length - 1}
                className="text-xs h-7 bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <ZoomIn className="h-3 w-3" />
              </Button>
            </div>

            {/* Current Time Display */}
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-orange-400" />
              <div className="text-lg font-mono text-orange-400">
                {currentTime.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Viewport Info */}
        <div className="flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center space-x-4">
            <span>
              Viewing: {viewportStart.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} -{" "}
              {viewportEnd.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </span>
            {selectedIncident && (
              <Badge variant="outline" className="bg-blue-900 text-blue-200 border-blue-600">
                Selected: {selectedIncident.type} @ {selectedIncident.camera.name}
              </Badge>
            )}
          </div>
          <div>
            Incidents in view: <span className="text-white font-medium">{visibleIncidents.length}</span>
          </div>
        </div>

        {/* Timeline Container */}
        <div className="relative bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
          {/* Camera List */}
          <div
            className="absolute left-0 top-0 bg-gray-900 border-r border-gray-700 z-10"
            style={{ width: leftPanelWidth, height: totalHeight }}
          >
            {/* Header */}
            <div
              className="flex items-center px-4 border-b border-gray-700 text-sm font-medium text-gray-300 bg-gray-800"
              style={{ height: headerHeight }}
            >
              <Camera className="h-4 w-4 mr-2" />
              Camera Feeds
            </div>

            {/* Camera Rows */}
            {cameras.map((camera, index) => {
              const hasSelectedIncident = selectedIncident?.camera.id === camera.id
              return (
                <div
                  key={camera.id}
                  className={`flex items-center px-4 border-b border-gray-700 text-sm text-white hover:bg-gray-800 transition-colors ${
                    hasSelectedIncident ? "bg-blue-900 border-blue-600" : ""
                  }`}
                  style={{ height: cameraRowHeight }}
                >
                  <div className="flex items-center space-x-3 w-full">
                    <div
                      className={`h-2 w-2 rounded-full animate-pulse flex-shrink-0 ${
                        hasSelectedIncident ? "bg-blue-400" : "bg-green-500"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium truncate ${hasSelectedIncident ? "text-blue-200" : ""}`}>
                        {camera.name}
                      </div>
                      <div
                        className={`text-xs opacity-70 truncate ${hasSelectedIncident ? "text-blue-300" : "text-gray-400"}`}
                      >
                        {camera.location}
                      </div>
                    </div>
                    {hasSelectedIncident && <Target className="h-3 w-3 text-blue-400" />}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Timeline SVG */}
          <div style={{ marginLeft: leftPanelWidth }}>
            <svg
              ref={timelineRef}
              width={timelineWidth}
              height={totalHeight}
              className="cursor-pointer"
              onClick={handleTimelineClick}
            >
              {/* Background */}
              <rect width={timelineWidth} height={totalHeight} fill="#1f2937" />

              {/* Time markers and labels */}
              {timeMarkers.map((marker, index) => (
                <g key={index}>
                  <line
                    x1={marker.x}
                    y1={0}
                    x2={marker.x}
                    y2={totalHeight}
                    stroke="#374151"
                    strokeWidth={marker.isHour ? 2 : 1}
                    opacity={marker.isHour ? 1 : 0.5}
                  />
                  <text
                    x={marker.x}
                    y={headerHeight - 15}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#9ca3af"
                    className="font-mono"
                  >
                    {marker.label}
                  </text>
                </g>
              ))}

              {/* Camera row separators */}
              {cameras.map((_, index) => (
                <line
                  key={index}
                  x1={0}
                  y1={headerHeight + (index + 1) * cameraRowHeight}
                  x2={timelineWidth}
                  y2={headerHeight + (index + 1) * cameraRowHeight}
                  stroke="#374151"
                  strokeWidth={1}
                />
              ))}

              {/* Incident blocks */}
              {processedIncidents.length > 0 ? (
                processedIncidents.map((incident) => (
                  <g key={incident.id}>
                    <rect
                      x={incident.startX}
                      y={incident.y}
                      width={incident.width}
                      height={incident.height}
                      fill={incident.color}
                      opacity={incident.isSelected ? 1 : 0.9}
                      stroke={incident.isSelected ? "#ffffff" : incident.color}
                      strokeWidth={incident.isSelected ? 4 : 1}
                      rx={4}
                      className="cursor-pointer hover:opacity-100 transition-all"
                      onClick={(e) => {
                        e.stopPropagation()
                        jumpToIncident(incident)
                      }}
                    />

                    {/* Selection indicator */}
                    {incident.isSelected && (
                      <rect
                        x={incident.startX - 2}
                        y={incident.y - 2}
                        width={incident.width + 4}
                        height={incident.height + 4}
                        fill="none"
                        stroke="#60a5fa"
                        strokeWidth={2}
                        rx={6}
                        className="animate-pulse"
                      />
                    )}

                    {/* Incident label */}
                    {incident.width > 40 && (
                      <text
                        x={incident.startX + incident.width / 2}
                        y={incident.y + incident.height / 2 + 3}
                        textAnchor="middle"
                        fontSize="9"
                        fill="white"
                        className="pointer-events-none font-medium"
                      >
                        {incident.type.split(" ")[0]}
                      </text>
                    )}

                    {/* Priority indicator */}
                    {(incident.severity === "critical" || incident.severity === "high") && (
                      <circle
                        cx={incident.startX + 6}
                        cy={incident.y + 6}
                        r={3}
                        fill="#ffffff"
                        className="animate-pulse"
                      />
                    )}
                  </g>
                ))
              ) : (
                <text
                  x={timelineWidth / 2}
                  y={headerHeight + (cameras.length * cameraRowHeight) / 2}
                  textAnchor="middle"
                  fontSize="14"
                  fill="#9ca3af"
                  className="pointer-events-none"
                >
                  No incidents in current view
                </text>
              )}

              {/* Current time scrubber */}
              {currentX >= 0 && currentX <= timelineWidth && (
                <>
                  <line
                    x1={currentX}
                    y1={0}
                    x2={currentX}
                    y2={totalHeight}
                    stroke="#f97316"
                    strokeWidth={3}
                    className="cursor-ew-resize"
                  />

                  {/* Scrubber handle */}
                  <circle
                    cx={currentX}
                    cy={headerHeight / 2}
                    r={8}
                    fill="#f97316"
                    stroke="white"
                    strokeWidth={2}
                    className="cursor-ew-resize"
                    onMouseDown={handleMouseDown}
                  />

                  {/* Time display on scrubber */}
                  <rect x={currentX - 30} y={5} width={60} height={20} fill="#000000" opacity={0.8} rx={4} />
                  <text
                    x={currentX}
                    y={18}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#f97316"
                    className="font-mono font-bold"
                  >
                    {currentTime.toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </text>
                </>
              )}
            </svg>
          </div>
        </div>

        {/* Incident Legend and Quick Actions */}
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {Array.from(new Set(visibleIncidents.map((i) => i.type)))
              .slice(0, 6)
              .map((type) => (
                <Badge key={type} variant="outline" className="text-xs bg-gray-800 border-gray-600 text-gray-300">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: getIncidentColor(visibleIncidents.find((i) => i.type === type)!) }}
                  />
                  {type}
                </Badge>
              ))}
          </div>

          {/* Quick Jump to High-Priority Incidents in current view */}
          <div className="flex flex-wrap gap-2">
            {visibleIncidents
              .filter((i) => i.severity === "critical" || i.severity === "high")
              .slice(0, 3)
              .map((incident) => (
                <Button
                  key={incident.id}
                  variant="outline"
                  size="sm"
                  onClick={() => jumpToIncident(incident)}
                  className="text-xs h-7 bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  {new Date(incident.tsStart).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  - {incident.type.split(" ")[0]}
                </Button>
              ))}
          </div>
        </div>
      </div>
    </Card>
  )
}
