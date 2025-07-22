import { NextResponse } from "next/server"
import { DatabaseService } from "@/lib/prisma"

export async function GET() {
  try {
    console.log("Debug: Fetching incidents...")

    // Test database connection
    const isHealthy = await DatabaseService.healthCheck()
    console.log("Database healthy:", isHealthy)

    // Get raw incidents from database
    const rawIncidents = await DatabaseService.getAllIncidents()
    console.log("Raw incidents from DB:", rawIncidents.length)

    // Transform incidents
    const transformedIncidents = rawIncidents.map((incident) => ({
      ...incident,
      type: incident.type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      severity: incident.severity.toLowerCase(),
      camera: {
        ...incident.camera,
        status: incident.camera.status.toLowerCase(),
      },
    }))

    console.log("Transformed incidents:", transformedIncidents.length)
    console.log("Sample transformed incident:", transformedIncidents[0])

    return NextResponse.json({
      success: true,
      count: transformedIncidents.length,
      incidents: transformedIncidents,
      sample: transformedIncidents[0],
      databaseHealthy: isHealthy,
    })
  } catch (error) {
    console.error("Debug API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
