import { type NextRequest, NextResponse } from "next/server"
import { DatabaseService } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const resolved = searchParams.get("resolved")

    const resolvedFilter = resolved !== null ? resolved === "true" : undefined
    const incidents = await DatabaseService.getIncidents(resolvedFilter)

    // Transform enum values to strings for frontend compatibility
    const transformedIncidents = incidents.map((incident) => ({
      ...incident,
      type: incident.type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      severity: incident.severity.toLowerCase(),
      camera: {
        ...incident.camera,
        status: incident.camera.status.toLowerCase(),
      },
    }))

    return NextResponse.json(transformedIncidents)
  } catch (error) {
    console.error("Error fetching incidents:", error)
    return NextResponse.json({ error: "Failed to fetch incidents" }, { status: 500 })
  }
}
