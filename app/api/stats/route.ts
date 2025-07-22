import { NextResponse } from "next/server"
import { DatabaseService } from "@/lib/prisma"

export async function GET() {
  try {
    const stats = await DatabaseService.getIncidentStats()

    // Transform enum values to strings for frontend compatibility
    const transformedStats = {
      ...stats,
      incidentsByType: stats.incidentsByType.map((item) => ({
        type: item.type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        count: item._count.type,
      })),
      incidentsBySeverity: stats.incidentsBySeverity.map((item) => ({
        severity: item.severity.toLowerCase(),
        count: item._count.severity,
      })),
    }

    return NextResponse.json(transformedStats)
  } catch (error) {
    console.error("Error fetching stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
