"use client"

import { Shield, Settings, Bell, User, Wifi, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"

interface Camera {
  id: number
  name: string
  location: string
  status: string
  _count: {
    incidents: number
  }
}

export function Navbar() {
  const [cameras, setCameras] = useState<Camera[]>([])
  const [onlineCameras, setOnlineCameras] = useState(0)

  useEffect(() => {
    const fetchCameras = async () => {
      try {
        const response = await fetch("/api/cameras")
        const cameraData = await response.json()
        setCameras(cameraData)
        setOnlineCameras(cameraData.filter((c: Camera) => c.status === "online").length)
      } catch (error) {
        console.error("Error fetching cameras:", error)
      }
    }

    fetchCameras()

    // Refresh camera data every 30 seconds
    const interval = setInterval(fetchCameras, 30000)
    return () => clearInterval(interval)
  }, [])

  const maintenanceCameras = cameras.filter((c) => c.status === "maintenance").length

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold">SecureSight</h1>
              <p className="text-xs text-muted-foreground">CCTV Monitoring System</p>
            </div>
          </div>
        </div>

        <div className="ml-auto flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {onlineCameras > 0 ? (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm text-muted-foreground">
                  {onlineCameras}/{cameras.length} Cameras Online
                </span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-500" />
                <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm text-muted-foreground">No Cameras Online</span>
              </>
            )}
          </div>

          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {maintenanceCameras > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 pl-1.5 text-xs">{maintenanceCameras}</Badge>
            )}
          </Button>

          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>

          <Button variant="ghost" size="icon">
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </nav>
  )
}
