import { NextResponse } from "next/server"
import { DatabaseService } from "@/lib/prisma"

export async function GET() {
  try {
    const timelineData = await DatabaseService.getTimelineData()

    // Transform enum values to strings for frontend compatibility
    const transformedData = timelineData.map((incident) => ({
      ...incident,
      type: incident.type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      severity: incident.severity.toLowerCase(),
      camera: {
        ...incident.camera,
        status: incident.camera.status.toLowerCase(),
      },
    }))

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error("Error fetching timeline data:", error)
    return NextResponse.json({ error: "Failed to fetch timeline data" }, { status: 500 })
  }
}
