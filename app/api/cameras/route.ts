import { NextResponse } from "next/server"
import { DatabaseService } from "@/lib/prisma"

export async function GET() {
  try {
    const cameras = await DatabaseService.getCameras()

    // Transform enum values to strings for frontend compatibility
    const transformedCameras = cameras.map((camera) => ({
      ...camera,
      status: camera.status.toLowerCase(),
    }))

    return NextResponse.json(transformedCameras)
  } catch (error) {
    console.error("Error fetching cameras:", error)
    return NextResponse.json({ error: "Failed to fetch cameras" }, { status: 500 })
  }
}
