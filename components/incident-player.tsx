"use client"

import { useState, useEffect } from "react"
import { Play, Pause, Volume2, Maximize, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Camera {
  id: number
  name: string
  location: string
  status: string
  thumbnailUrl?: string
}

interface IncidentPlayerProps {
  selectedIncident?: {
    id: number
    type: string
    camera: {
      name: string
      location: string
    }
    tsStart: string
    tsEnd: string
    thumbnailUrl: string
    severity: string
    description?: string
  }
  currentTime?: string
}

export function IncidentPlayer({ selectedIncident, currentTime }: IncidentPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [cameras, setCameras] = useState<Camera[]>([])

  useEffect(() => {
    const fetchCameras = async () => {
      try {
        const response = await fetch("/api/cameras")
        const cameraData = await response.json()
        setCameras(cameraData)
      } catch (error) {
        console.error("Error fetching cameras:", error)
      }
    }

    fetchCameras()
  }, [])

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const getIncidentColor = (type: string) => {
    switch (type) {
      case "Gun Threat":
        return "bg-red-500 dark:bg-red-600"
      case "Unauthorised Access":
        return "bg-orange-500 dark:bg-orange-600"
      case "Face Recognised":
        return "bg-blue-500 dark:bg-blue-600"
      case "Suspicious Activity":
        return "bg-yellow-500 dark:bg-yellow-600"
      case "Motion Detection":
        return "bg-green-500 dark:bg-green-600"
      case "Equipment Tampering":
        return "bg-purple-500 dark:bg-purple-600"
      default:
        return "bg-gray-500 dark:bg-gray-600"
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-600 dark:bg-red-700"
      case "high":
        return "bg-orange-500 dark:bg-orange-600"
      case "medium":
        return "bg-yellow-500 dark:bg-yellow-600"
      case "low":
        return "bg-green-500 dark:bg-green-600"
      default:
        return "bg-gray-500 dark:bg-gray-600"
    }
  }

  return (
    <div className="space-y-4">
      {/* Main Video Player */}
      <Card className="relative overflow-hidden bg-card dark:bg-slate-900 border-border dark:border-slate-800">
        <div className="aspect-video bg-black dark:bg-slate-950 flex items-center justify-center relative">
          {selectedIncident ? (
            <img
              src={selectedIncident.thumbnailUrl || "/placeholder.svg?height=400&width=600&query=security+incident"}
              alt={`${selectedIncident.type} incident`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center text-white/70 dark:text-slate-400">
              <img
                src="/placeholder.svg?height=64&width=64"
                alt="Camera Icon"
                className="h-16 w-16 mx-auto mb-4 opacity-50"
              />
              <p className="text-lg">Select an incident to view</p>
              <p className="text-sm opacity-70">Choose from the incident list on the right</p>
            </div>
          )}

          {selectedIncident && (
            <>
              {/* Incident Info Overlay */}
              <div className="absolute top-4 left-4 space-y-2">
                <div className="flex items-center space-x-2">
                  <Badge className={`${getIncidentColor(selectedIncident.type)} text-white border-0`}>
                    {selectedIncident.type}
                  </Badge>
                  <Badge
                    className={`${getSeverityColor(selectedIncident.severity)} text-white border-0 ${
                      selectedIncident.severity === "critical"
                        ? "severity-critical"
                        : selectedIncident.severity === "high"
                          ? "severity-high"
                          : selectedIncident.severity === "medium"
                            ? "severity-medium"
                            : "severity-low"
                    }`}
                  >
                    {selectedIncident.severity.toUpperCase()}
                  </Badge>
                </div>
                <div className="bg-black/80 dark:bg-slate-900/90 text-white px-3 py-1 rounded text-sm backdrop-blur-sm">
                  {selectedIncident.camera.name} - {selectedIncident.camera.location}
                </div>
                <div className="bg-black/80 dark:bg-slate-900/90 text-white px-3 py-1 rounded text-sm backdrop-blur-sm">
                  {formatTime(selectedIncident.tsStart)} - {formatTime(selectedIncident.tsEnd)}
                </div>
                {selectedIncident.description && (
                  <div className="bg-black/80 dark:bg-slate-900/90 text-white px-3 py-1 rounded text-sm max-w-xs backdrop-blur-sm">
                    {selectedIncident.description}
                  </div>
                )}
                {currentTime && (
                  <div className="bg-black/80 dark:bg-slate-900/90 text-white px-3 py-1 rounded text-sm backdrop-blur-sm">
                    Timeline:{" "}
                    {new Date(currentTime).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </div>
                )}
              </div>

              {/* Severity Warning */}
              {(selectedIncident.severity === "critical" || selectedIncident.severity === "high") && (
                <div className="absolute top-4 right-4">
                  <div className="flex items-center space-x-1 bg-red-600 dark:bg-red-700 text-white px-3 py-1 rounded animate-pulse backdrop-blur-sm">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">HIGH PRIORITY</span>
                  </div>
                </div>
              )}

              {/* Video Controls */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center justify-between bg-black/80 dark:bg-slate-900/90 rounded-lg px-4 py-2 backdrop-blur-sm">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20 dark:hover:bg-slate-700/50"
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <div className="w-32 h-1 bg-white/30 dark:bg-slate-600 rounded-full">
                      <div className="w-1/3 h-full bg-white dark:bg-blue-400 rounded-full" />
                    </div>
                    <span className="text-white text-sm">1:23 / 2:15</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20 dark:hover:bg-slate-700/50"
                    >
                      <Volume2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20 dark:hover:bg-slate-700/50"
                    >
                      <Maximize className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Camera Thumbnails Strip */}
      <div className="flex space-x-2">
        {cameras.slice(0, 3).map((camera) => (
          <Card
            key={camera.id}
            className="flex-1 overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 dark:hover:ring-blue-400 transition-all bg-card dark:bg-slate-900 border-border dark:border-slate-800"
          >
            <div className="aspect-video bg-gray-100 dark:bg-slate-800 flex items-center justify-center relative">
              <img
                src={
                  camera.thumbnailUrl ||
                  `/placeholder.svg?height=80&width=120&query=security+camera+${camera.name.toLowerCase().replace(/\s+/g, "+") || "/placeholder.svg"}`
                }
                alt={camera.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/80 dark:bg-slate-900/90 text-white p-2 backdrop-blur-sm">
                <p className="text-xs font-medium truncate">{camera.name}</p>
                <p className="text-xs opacity-70 truncate">{camera.location}</p>
              </div>
              <div className="absolute top-2 right-2">
                <div
                  className={`h-2 w-2 rounded-full ${
                    camera.status === "online"
                      ? "bg-green-500 animate-pulse camera-status-online"
                      : camera.status === "maintenance"
                        ? "bg-yellow-500 camera-status-maintenance"
                        : "bg-red-500 camera-status-offline"
                  }`}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
