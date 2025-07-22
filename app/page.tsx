"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Navbar } from "@/components/navbar"
import { IncidentPlayer } from "@/components/incident-player"
import { IncidentList } from "@/components/incident-list"
import { IncidentTimeline } from "@/components/incident-timeline"

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

export default function Dashboard() {
  const [selectedIncident, setSelectedIncident] = useState<IncidentWithCamera | undefined>()
  const [allIncidents, setAllIncidents] = useState<IncidentWithCamera[]>([])
  const [currentTime, setCurrentTime] = useState<string>(() => new Date().toISOString())
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0] // YYYY-MM-DD format
  })
  const [loading, setLoading] = useState(true)
  const [lastFetchTime, setLastFetchTime] = useState<number>(0)

  // Fetch all incidents for both timeline and incident list
  const fetchAllIncidents = useCallback(
    async (force = false) => {
      // Prevent too frequent API calls
      const now = Date.now()
      if (!force && now - lastFetchTime < 5000) {
        console.log("Skipping fetch - too recent")
        return
      }

      try {
        setLoading(true)
        console.log("Fetching incidents from /api/incidents/all...")
        const response = await fetch("/api/incidents/all", {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
          },
        })
        if (!response.ok) {
          throw new Error(`Failed to fetch incidents: ${response.status}`)
        }
        const data = await response.json()
        console.log("Fetched incidents:", data.length, "incidents")

        // Ensure dates are properly formatted
        const processedData = data.map((incident: any) => ({
          ...incident,
          tsStart: new Date(incident.tsStart).toISOString(),
          tsEnd: new Date(incident.tsEnd).toISOString(),
        }))

        setAllIncidents(processedData)
        setLastFetchTime(now)
      } catch (error) {
        console.error("Error fetching incidents:", error)
        setAllIncidents([]) // Set empty array on error
      } finally {
        setLoading(false)
      }
    },
    [lastFetchTime],
  )

  // Initial fetch
  useEffect(() => {
    fetchAllIncidents(true)
  }, [])

  // Optimistic update for incident resolution
  const handleIncidentResolve = useCallback((incidentId: number, newResolvedState: boolean) => {
    console.log("Optimistically updating incident:", incidentId, "to resolved:", newResolvedState)

    setAllIncidents((prevIncidents) =>
      prevIncidents.map((incident) =>
        incident.id === incidentId ? { ...incident, resolved: newResolvedState } : incident,
      ),
    )

    // Update selected incident if it's the one being resolved
    setSelectedIncident((prevSelected) =>
      prevSelected?.id === incidentId ? { ...prevSelected, resolved: newResolvedState } : prevSelected,
    )
  }, [])

  // Handle timeline time changes
  const handleTimeChange = useCallback((timestamp: string) => {
    setCurrentTime(timestamp)
  }, [])

  // Handle incident selection from either timeline or incident list
  const handleIncidentSelect = useCallback((incident: IncidentWithCamera) => {
    console.log("Incident selected:", incident.id, "from", incident.type)
    setSelectedIncident(incident)

    // Update current time to match incident start time for better synchronization
    setCurrentTime(incident.tsStart)
  }, [])

  // Handle date changes from timeline only
  const handleDateChange = useCallback((date: string) => {
    console.log("Date changed to:", date)

    // Validate the date string before creating Date object
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      console.error("Invalid date format:", date)
      return
    }

    try {
      // Test if date is valid
      const testDate = new Date(date + "T00:00:00")
      if (isNaN(testDate.getTime())) {
        console.error("Invalid date value:", date)
        return
      }

      setSelectedDate(date)

      // Clear selected incident when date changes to avoid confusion
      setSelectedIncident(undefined)

      // Update current time to start of new date - create date more safely
      const newDateTime = new Date(date + "T12:00:00") // Use ISO format
      if (!isNaN(newDateTime.getTime())) {
        setCurrentTime(newDateTime.toISOString())
      }
    } catch (error) {
      console.error("Error handling date change:", error)
    }
  }, [])

  // Memoized timeline incidents to prevent unnecessary processing
  const timelineIncidents = useMemo(() => {
    console.log("Processing incidents for timeline:", allIncidents.length)
    return allIncidents.map((incident) => ({
      id: incident.id,
      type: incident.type,
      tsStart: incident.tsStart,
      tsEnd: incident.tsEnd,
      severity: incident.severity,
      camera: {
        id: incident.camera.id,
        name: incident.camera.name,
        location: incident.camera.location,
      },
    }))
  }, [allIncidents])

  // Get incidents for the selected date for summary display
  const selectedDateIncidents = useMemo(() => {
    const selectedDateStart = new Date(selectedDate)
    selectedDateStart.setHours(0, 0, 0, 0)
    const selectedDateEnd = new Date(selectedDate)
    selectedDateEnd.setHours(23, 59, 59, 999)

    return allIncidents.filter((incident) => {
      const incidentDate = new Date(incident.tsStart)
      return incidentDate >= selectedDateStart && incidentDate <= selectedDateEnd
    })
  }, [allIncidents, selectedDate])

  if (loading && allIncidents.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Top Section - Player and Incident List */}
        <div className="flex flex-1">
          {/* Left Side - Incident Player */}
          <div className="flex-1 p-6">
            <div className="h-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Incident Player</h2>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span>
                    Timeline Date:{" "}
                    {new Date(selectedDate).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span>•</span>
                  <span>{selectedDateIncidents.length} incidents on timeline</span>
                  <span>•</span>
                  <span>{allIncidents.length} total incidents</span>
                  {selectedIncident && (
                    <>
                      <span>•</span>
                      <span className="text-blue-600 font-medium">Viewing: {selectedIncident.type}</span>
                    </>
                  )}
                </div>
              </div>
              <IncidentPlayer selectedIncident={selectedIncident} currentTime={currentTime} />
            </div>
          </div>

          {/* Right Side - Incident List */}
          <div className="w-100 border-l bg-muted/30 p-6">
            <IncidentList
              onIncidentSelect={handleIncidentSelect}
              selectedIncidentId={selectedIncident?.id}
              allIncidents={allIncidents}
              onIncidentResolve={handleIncidentResolve}
              onRefresh={() => fetchAllIncidents(true)}
            />
          </div>
        </div>

        {/* Bottom Section - Timeline */}
        <div className="border-t bg-background p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Interactive Timeline</h2>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>{timelineIncidents.length} total incidents</span>
              <span>•</span>
              <span>
                {selectedDateIncidents.length} on{" "}
                {new Date(selectedDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
              {loading && <span className="ml-2 text-blue-600">• Refreshing...</span>}
              {selectedIncident && (
                <>
                  <span>•</span>
                  <span className="text-blue-600 font-medium">Selected: {selectedIncident.camera.name}</span>
                </>
              )}
            </div>
          </div>
          <IncidentTimeline
            incidents={timelineIncidents}
            onTimeChange={handleTimeChange}
            onIncidentSelect={handleIncidentSelect}
            selectedIncident={selectedIncident}
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
          />
        </div>
      </div>
    </div>
  )
}
