import { type NextRequest, NextResponse } from "next/server"
import { DatabaseService } from "@/lib/prisma"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Await params in Next.js 15
    const { id } = await params
    const incidentId = Number.parseInt(id)

    if (isNaN(incidentId)) {
      return NextResponse.json({ error: "Invalid incident ID" }, { status: 400 })
    }

    const updatedIncident = await DatabaseService.resolveIncident(incidentId)

    // Transform enum values to strings for frontend compatibility
    const transformedIncident = {
      ...updatedIncident,
      type: updatedIncident.type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      severity: updatedIncident.severity.toLowerCase(),
      camera: {
        ...updatedIncident.camera,
        status: updatedIncident.camera.status.toLowerCase(),
      },
    }

    return NextResponse.json(transformedIncident)
  } catch (error) {
    console.error("Error resolving incident:", error)

    if (error.message === "Incident not found") {
      return NextResponse.json({ error: "Incident not found" }, { status: 404 })
    }

    return NextResponse.json({ error: "Failed to resolve incident" }, { status: 500 })
  }
}
