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
        return "bg-red-500"
      case "Unauthorised Access":
        return "bg-orange-500"
      case "Face Recognised":
        return "bg-blue-500"
      case "Suspicious Activity":
        return "bg-yellow-500"
      case "Motion Detection":
        return "bg-green-500"
      case "Equipment Tampering":
        return "bg-purple-500"
      default:
        return "bg-gray-500"
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-600"
      case "high":
        return "bg-orange-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="space-y-4">
      {/* Main Video Player */}
      <Card className="relative overflow-hidden">
        <div className="aspect-video bg-black flex items-center justify-center relative">
          {selectedIncident ? (
            <img
              src={selectedIncident.thumbnailUrl || "/placeholder.svg"}
              alt={`${selectedIncident.type} incident`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center text-white/70">
              <img src="/placeholder.svg" alt="Camera Icon" className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Select an incident to view</p>
              <p className="text-sm opacity-70">Choose from the incident list on the right</p>
            </div>
          )}

          {selectedIncident && (
            <>
              {/* Incident Info Overlay */}
              <div className="absolute top-4 left-4 space-y-2">
                <div className="flex items-center space-x-2">
                  <Badge className={`${getIncidentColor(selectedIncident.type)} text-white`}>
                    {selectedIncident.type}
                  </Badge>
                  <Badge className={`${getSeverityColor(selectedIncident.severity)} text-white`}>
                    {selectedIncident.severity.toUpperCase()}
                  </Badge>
                </div>
                <div className="bg-black/70 text-white px-3 py-1 rounded text-sm">
                  {selectedIncident.camera.name} - {selectedIncident.camera.location}
                </div>
                <div className="bg-black/70 text-white px-3 py-1 rounded text-sm">
                  {formatTime(selectedIncident.tsStart)} - {formatTime(selectedIncident.tsEnd)}
                </div>
                {selectedIncident.description && (
                  <div className="bg-black/70 text-white px-3 py-1 rounded text-sm max-w-xs">
                    {selectedIncident.description}
                  </div>
                )}
                {currentTime && (
                  <div className="bg-black/70 text-white px-3 py-1 rounded text-sm">
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
                  <div className="flex items-center space-x-1 bg-red-600 text-white px-3 py-1 rounded animate-pulse">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">HIGH PRIORITY</span>
                  </div>
                </div>
              )}

              {/* Video Controls */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center justify-between bg-black/70 rounded-lg px-4 py-2">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <div className="w-32 h-1 bg-white/30 rounded-full">
                      <div className="w-1/3 h-full bg-white rounded-full" />
                    </div>
                    <span className="text-white text-sm">1:23 / 2:15</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                      <Volume2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
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
            className="flex-1 overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
          >
            <div className="aspect-video bg-gray-100 flex items-center justify-center relative">
              <img
                src={`/placeholder.svg?height=80&width=120&query=security+camera+${camera.name.toLowerCase().replace(/\s+/g, "+")}`}
                alt={camera.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2">
                <p className="text-xs font-medium truncate">{camera.name}</p>
                <p className="text-xs opacity-70 truncate">{camera.location}</p>
              </div>
              <div className="absolute top-2 right-2">
                <div
                  className={`h-2 w-2 rounded-full ${
                    camera.status === "online"
                      ? "bg-green-500 animate-pulse"
                      : camera.status === "maintenance"
                        ? "bg-yellow-500"
                        : "bg-red-500"
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
