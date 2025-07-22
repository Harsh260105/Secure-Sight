import { type NextRequest, NextResponse } from "next/server"
import { DatabaseService } from "@/lib/prisma"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Await params in Next.js 15
    const { id } = await params
    const cameraId = Number.parseInt(id)
    const { status } = await request.json()

    if (isNaN(cameraId)) {
      return NextResponse.json({ error: "Invalid camera ID" }, { status: 400 })
    }

    if (!["online", "offline", "maintenance"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const updatedCamera = await DatabaseService.updateCameraStatus(cameraId, status.toUpperCase())

    // Transform enum values to strings for frontend compatibility
    const transformedCamera = {
      ...updatedCamera,
      status: updatedCamera.status.toLowerCase(),
    }

    return NextResponse.json(transformedCamera)
  } catch (error) {
    console.error("Error updating camera status:", error)
    return NextResponse.json({ error: "Failed to update camera status" }, { status: 500 })
  }
}
