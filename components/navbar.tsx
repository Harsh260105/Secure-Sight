"use client"

import { Shield, Settings, Bell, User, Wifi, WifiOff, Moon, Sun, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

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
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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

  if (!mounted) {
    return null
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:border-slate-800">
      <div className="flex h-16 items-center px-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <div>
              <h1 className="text-xl font-bold text-foreground">SecureSight</h1>
              <p className="text-xs text-muted-foreground">CCTV Monitoring System</p>
            </div>
          </div>
        </div>

        <div className="ml-auto flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {onlineCameras > 0 ? (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse camera-status-online" />
                <span className="text-sm text-muted-foreground">
                  {onlineCameras}/{cameras.length} Cameras Online
                </span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-500" />
                <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse camera-status-offline" />
                <span className="text-sm text-muted-foreground">No Cameras Online</span>
              </>
            )}
          </div>

          <Button variant="ghost" size="icon" className="relative hover:bg-muted dark:hover:bg-slate-800">
            <Bell className="h-5 w-5" />
            {maintenanceCameras > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs pl-1.5 bg-amber-500 text-white">
                {maintenanceCameras}
              </Badge>
            )}
          </Button>

          {/* Theme Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-muted dark:hover:bg-slate-800">
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="dark:bg-slate-900 dark:border-slate-800">
              <DropdownMenuItem onClick={() => setTheme("light")} className="dark:hover:bg-slate-800">
                <Sun className="mr-2 h-4 w-4" />
                <span>Light</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")} className="dark:hover:bg-slate-800">
                <Moon className="mr-2 h-4 w-4" />
                <span>Dark</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")} className="dark:hover:bg-slate-800">
                <Monitor className="mr-2 h-4 w-4" />
                <span>System</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" className="hover:bg-muted dark:hover:bg-slate-800">
            <Settings className="h-5 w-5" />
          </Button>

          <Button variant="ghost" size="icon" className="hover:bg-muted dark:hover:bg-slate-800">
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </nav>
  )
}
